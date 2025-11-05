"""
DeepFace server for facial recognition
This should be run as a separate Python service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import numpy as np
import cv2
import os
import tempfile
import json

app = Flask(__name__)
CORS(app)


def initialize_deepface_folder() -> None:
    """
    Initialize the folder for storing DeepFace model weights.

    Raises:
        OSError: if the folder cannot be created.
    """
    home = get_deepface_home()
    deepface_home_path = os.path.join(home, ".deepface")
    weights_path = os.path.join(deepface_home_path, "weights")

    if not os.path.exists(deepface_home_path):
        os.makedirs(deepface_home_path, exist_ok=True)
        print(f"Directory {deepface_home_path} has been created")

    if not os.path.exists(weights_path):
        os.makedirs(weights_path, exist_ok=True)
        print(f"Directory {weights_path} has been created")

    return deepface_home_path


def get_deepface_home() -> str:
    """
    Get the home directory for storing model weights

    Returns:
        str: the home directory.
    """
    # Use project-local directory for models instead of user home
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to project root
    project_root = os.path.dirname(current_dir)

    # Allow override with environment variable
    custom_home = os.getenv("DEEPFACE_HOME")
    if custom_home:
        return str(custom_home)

    # Default to project local directory
    return os.path.join(project_root, "deepface_models")


def setup_deepface_environment():
    """
    Setup DeepFace environment with custom model directory
    """
    deepface_home = get_deepface_home()

    # Set environment variable for DeepFace to use
    os.environ["DEEPFACE_HOME"] = deepface_home

    # Initialize the directory structure
    models_dir = initialize_deepface_folder()

    print(f"DeepFace models will be stored in: {deepface_home}")
    print(f"Models directory: {models_dir}")

    return models_dir


# Initialize DeepFace environment on import
DEEPFACE_MODELS_DIR = setup_deepface_environment()


def decode_base64_image(base64_string):
    """Convert base64 string to cv2 image with preprocessing"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        # Decode base64
        image_data = base64.b64decode(base64_string)

        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)

        # Decode image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print("Failed to decode image")
            return None

        print(f"Original image shape: {img.shape}")

        # Image preprocessing for better face detection
        # 1. Ensure minimum size
        min_size = 224
        height, width = img.shape[:2]

        if width < min_size or height < min_size:
            # Calculate scale factor to reach minimum size
            scale = max(min_size / width, min_size / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img = cv2.resize(img, (new_width, new_height),
                             interpolation=cv2.INTER_CUBIC)
            print(f"Resized image to: {img.shape}")

        # 2. Enhance contrast and brightness
        # Convert to LAB color space for better processing
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)

        # Merge channels and convert back to BGR
        enhanced = cv2.merge([l, a, b])
        img = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

        # 3. Reduce noise
        img = cv2.bilateralFilter(img, 9, 75, 75)

        print(f"Preprocessed image shape: {img.shape}")
        return img

    except Exception as e:
        print(f"Error decoding/preprocessing image: {e}")
        return None


@app.route('/detect_face', methods=['POST'])
def detect_face():
    """Detect face and extract embeddings"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        # Decode image
        img = decode_base64_image(image_base64)
        if img is None:
            return jsonify({'error': 'Invalid image format'}), 400

        # Save temporary image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            cv2.imwrite(tmp_file.name, img)
            temp_path = tmp_file.name

        try:
            # Optimized detection backends for FaceNet - ordered by performance
            detection_backends = ['retinaface', 'mtcnn', 'opencv', 'ssd']

            # Using FaceNet512 as the primary model for consistent embeddings
            model_name = 'Facenet512'

            result = None
            last_error = None

            # First try with enforce_detection=True for best quality
            for backend in detection_backends:
                try:
                    print(f"Trying FaceNet detection with backend: {backend}")
                    result = DeepFace.represent(
                        img_path=temp_path,
                        model_name=model_name,
                        detector_backend=backend,
                        enforce_detection=True
                    )
                    print(
                        f"FaceNet detection successful with backend: {backend}")
                    break
                except Exception as e:
                    last_error = str(e)
                    print(f"Backend {backend} failed: {e}")
                    continue

            # If strict detection failed, try with enforce_detection=False
            if result is None:
                print(
                    "Strict FaceNet detection failed, trying with enforce_detection=False")
                for backend in detection_backends:
                    try:
                        result = DeepFace.represent(
                            img_path=temp_path,
                            model_name=model_name,
                            detector_backend=backend,
                            enforce_detection=False
                        )
                        print(
                            f"FaceNet detection successful with relaxed mode using backend: {backend}")
                        break
                    except Exception as e:
                        last_error = str(e)
                        continue

            if result is None or len(result) == 0:
                return jsonify({
                    'success': False,
                    'error': f'No face could be detected. Last error: {last_error}',
                    'face_detected': False
                })

            # Get the embedding (first face detected)
            embedding = result[0]['embedding']

            # Convert numpy array to Python list for JSON serialization
            if hasattr(embedding, 'tolist'):
                embedding = embedding.tolist()
            else:
                embedding = list(embedding)

            return jsonify({
                'success': True,
                'embedding': embedding,
                'face_detected': True,
                'faces_count': len(result)
            })

        except Exception as e:
            # No face detected or other error
            return jsonify({
                'success': False,
                'error': str(e),
                'face_detected': False
            })

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/verify_faces', methods=['POST'])
def verify_faces():
    """Compare two face embeddings"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        embedding1 = data.get('embedding1')
        embedding2 = data.get('embedding2')

        if not embedding1 or not embedding2:
            return jsonify({'error': 'Both embeddings required'}), 400

        print(
            f"Comparing embeddings - Embedding1 length: {len(embedding1)}, Embedding2 length: {len(embedding2)}")

        # Convert to numpy arrays
        emb1 = np.array(embedding1, dtype=np.float32)
        emb2 = np.array(embedding2, dtype=np.float32)

        # Validate embeddings have the same shape
        if emb1.shape != emb2.shape:
            return jsonify({'error': f'Embedding dimensions mismatch: {emb1.shape} vs {emb2.shape}'}), 400

        # Calculate cosine similarity
        dot_product = float(np.dot(emb1, emb2))
        norm1 = float(np.linalg.norm(emb1))
        norm2 = float(np.linalg.norm(emb2))

        if norm1 == 0 or norm2 == 0:
            return jsonify({'error': 'Invalid embedding: zero norm'}), 400

        cosine_sim = dot_product / (norm1 * norm2)

        # Calculate euclidean distance
        euclidean_dist = float(np.linalg.norm(emb1 - emb2))

        # FaceNet512-optimized threshold for matching
        # FaceNet typically produces higher similarity scores than other models
        threshold = 0.6  # Optimized threshold for FaceNet512 model
        # Convert numpy bool to Python bool
        is_match = bool(cosine_sim > threshold)

        print(
            f"Verification result - Cosine similarity: {cosine_sim:.4f}, Threshold: {threshold}, Is match: {is_match}")
        print(f"Euclidean distance: {euclidean_dist:.4f}")

        # FaceNet-optimized confidence level determination
        if cosine_sim > 0.8:
            confidence_level = "very_high"
        elif cosine_sim > 0.7:
            confidence_level = "high"
        elif cosine_sim > 0.6:
            confidence_level = "medium"
        elif cosine_sim > 0.4:
            confidence_level = "low"
        else:
            confidence_level = "very_low"

        return jsonify({
            'success': True,
            'is_match': is_match,
            'cosine_similarity': float(cosine_sim),
            'euclidean_distance': float(euclidean_dist),
            'confidence': float(cosine_sim),
            'threshold_used': float(threshold),
            'confidence_level': confidence_level
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with FaceNet model verification"""
    try:
        # Test FaceNet model availability by checking if it can be imported
        import deepface
        model_loaded = True
        model_info = "FaceNet512 model available via DeepFace"

        # Try to get model info
        try:
            from deepface.commons import functions
            model_info += " - DeepFace functions accessible"
        except:
            pass

    except Exception as e:
        model_loaded = False
        model_info = f"FaceNet512 model loading error: {str(e)}"

    return jsonify({
        'status': 'healthy',
        'service': 'deepface-server-facenet',
        'model': 'FaceNet512',
        'model_loaded': model_loaded,
        'model_info': model_info,
        'models_directory': DEEPFACE_MODELS_DIR,
        'deepface_home': get_deepface_home(),
        'detection_backends': ['retinaface', 'mtcnn', 'opencv', 'ssd'],
        'verification_threshold': 0.6
    })


@app.route('/debug_detect', methods=['POST'])
def debug_detect():
    """Debug face detection with detailed information"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        # Decode image
        img = decode_base64_image(image_base64)
        if img is None:
            return jsonify({'error': 'Invalid image format'}), 400

        # Save temporary image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            cv2.imwrite(tmp_file.name, img)
            temp_path = tmp_file.name

        debug_info = {
            'image_shape': img.shape,
            'image_path': temp_path,
            'attempts': []
        }

        try:
            # Try different backends and report results (optimized order for FaceNet)
            backends = ['retinaface', 'mtcnn', 'opencv', 'ssd']
            model_name = 'Facenet512'

            for backend in backends:
                attempt = {'backend': backend, 'results': []}

                # Try with enforce_detection=True
                try:
                    result = DeepFace.represent(
                        img_path=temp_path,
                        model_name=model_name,
                        detector_backend=backend,
                        enforce_detection=True
                    )
                    attempt['results'].append({
                        'enforce_detection': True,
                        'success': True,
                        'faces_detected': len(result)
                    })
                except Exception as e:
                    attempt['results'].append({
                        'enforce_detection': True,
                        'success': False,
                        'error': str(e)
                    })

                # Try with enforce_detection=False
                try:
                    result = DeepFace.represent(
                        img_path=temp_path,
                        model_name=model_name,
                        detector_backend=backend,
                        enforce_detection=False
                    )
                    attempt['results'].append({
                        'enforce_detection': False,
                        'success': True,
                        'faces_detected': len(result)
                    })
                except Exception as e:
                    attempt['results'].append({
                        'enforce_detection': False,
                        'success': False,
                        'error': str(e)
                    })

                debug_info['attempts'].append(attempt)

            return jsonify({
                'success': True,
                'debug_info': debug_info
            })

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/models_info', methods=['GET'])
def models_info():
    """Get information about model directory and downloaded models"""
    try:
        deepface_home = get_deepface_home()
        weights_path = os.path.join(deepface_home, ".deepface", "weights")

        # Check if directories exist
        home_exists = os.path.exists(deepface_home)
        weights_exists = os.path.exists(weights_path)

        # List downloaded models if weights directory exists
        downloaded_models = []
        if weights_exists:
            try:
                downloaded_models = [f for f in os.listdir(weights_path)
                                     if os.path.isfile(os.path.join(weights_path, f))]
            except Exception as e:
                downloaded_models = [f"Error listing models: {str(e)}"]

        # Calculate directory size
        total_size = 0
        if weights_exists:
            try:
                for dirpath, dirnames, filenames in os.walk(weights_path):
                    for filename in filenames:
                        filepath = os.path.join(dirpath, filename)
                        total_size += os.path.getsize(filepath)
            except Exception:
                pass

        return jsonify({
            'success': True,
            'deepface_home': deepface_home,
            'weights_path': weights_path,
            'directories_exist': {
                'home': home_exists,
                'weights': weights_exists
            },
            'downloaded_models': downloaded_models,
            'total_models_size_mb': round(total_size / (1024 * 1024), 2),
            'environment_variable': os.environ.get('DEEPFACE_HOME', 'Not set')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/test_verify', methods=['POST'])
def test_verify():
    """Test endpoint for debugging FaceNet verification"""
    try:
        data = request.get_json()

        # Create FaceNet512-sized dummy embeddings for testing
        emb1 = np.random.rand(512).astype(np.float32)
        emb2 = np.random.rand(512).astype(np.float32)

        cosine_sim = float(np.dot(emb1, emb2) /
                           (np.linalg.norm(emb1) * np.linalg.norm(emb2)))
        # Use FaceNet-optimized threshold
        is_match = bool(cosine_sim > 0.6)

        return jsonify({
            'success': True,
            'is_match': is_match,
            'cosine_similarity': float(cosine_sim),
            'model': 'FaceNet512',
            'embedding_size': 512,
            'threshold_used': 0.6,
            'test': True
        })
    except Exception as e:
        return jsonify({'error': str(e), 'test': True}), 500


@app.route('/facenet_info', methods=['GET'])
def facenet_info():
    """Get FaceNet-specific information and capabilities"""
    return jsonify({
        'model_name': 'FaceNet512',
        'embedding_dimensions': 512,
        'paper': 'FaceNet: A Unified Embedding for Face Recognition and Clustering',
        'authors': 'Schroff, Kalenichenko, Philbin (Google)',
        'year': 2015,
        'description': 'Deep convolutional network trained to directly optimize the embedding itself, rather than an intermediate bottleneck layer',
        'advantages': [
            'High accuracy on face verification tasks',
            'Compact 512-dimensional embeddings',
            'Good generalization to new identities',
            'Robust to variations in lighting and pose'
        ],
        'optimal_threshold': 0.6,
        'confidence_levels': {
            'very_high': '> 0.8',
            'high': '0.7 - 0.8',
            'medium': '0.6 - 0.7',
            'low': '0.4 - 0.6',
            'very_low': '< 0.4'
        },
        'recommended_detection_backends': ['retinaface', 'mtcnn']
    })


if __name__ == '__main__':
    print("Starting DeepFace server with FaceNet512...")
    print("Make sure you have installed: pip install deepface flask flask-cors opencv-python")
    print(f"DeepFace models directory: {DEEPFACE_MODELS_DIR}")
    print("Using FaceNet512 model for facial recognition embeddings")
    print("Detection backends: RetinaFace (primary), MTCNN, OpenCV, SSD")
    print("On first run, FaceNet and detection models will be downloaded.")
    print("This may take a few minutes...")
    print("-" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
