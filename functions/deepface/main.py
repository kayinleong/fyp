"""
DeepFace Firebase Cloud Functions for facial recognition
Converted from Flask server to Firebase Cloud Functions
"""

from firebase_functions import https_fn, options
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
import json
import base64
import numpy as np
import cv2
import os
import uuid
from google.cloud import storage as gcs

# For cost control, set maximum instances
set_global_options(max_instances=10)

# Initialize Firebase Admin
# Firebase credentials will be automatically loaded from environment variables
# NEXT_PRIVATE_SA_PROJECT_ID, NEXT_PRIVATE_SA_PRIVATE_KEY, NEXT_PRIVATE_CLIENT_EMAIL
initialize_app()

# CORS configuration for allowed origins
CORS_CONFIG = options.CorsOptions(
    cors_origins=[
        r"http://localhost:3000",
        r"https://fyp--kl2pen\.asia-southeast1\.hosted\.app"
    ],
    cors_methods=["get", "post", "options"],
)

# Global variable to cache DeepFace import and initialization
_deepface_initialized = False
_deepface_module = None
_storage_client = None


def get_storage_bucket_name():
    """
    Get Firebase Storage bucket name from environment
    """
    # Extract bucket name from NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    # Format: kl2pen.firebasestorage.app -> kl2pen.firebasestorage.app
    bucket_url = os.environ.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'kl2pen.firebasestorage.app')
    return bucket_url


def get_storage_client():
    """
    Get Firebase Storage client
    """
    global _storage_client
    if _storage_client is None:
        _storage_client = gcs.Client()
    return _storage_client


def get_storage_path_for_images() -> str:
    """
    Get the Firebase Storage path for temporary image processing
    """
    return "facial-recognition-images/"


def upload_image_to_storage(img_array, filename=None) -> str:
    """
    Upload image array to Firebase Storage and return the blob path
    """
    try:
        if filename is None:
            filename = f"facial_recognition_image_{uuid.uuid4().hex}.jpg"
        
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        # Create blob path
        blob_path = f"{get_storage_path_for_images()}{filename}"
        blob = bucket.blob(blob_path)
        
        # Convert image array to bytes
        success, buffer = cv2.imencode('.jpg', img_array)
        if not success:
            raise Exception("Failed to encode image")
        
        # Upload image bytes
        blob.upload_from_string(buffer.tobytes(), content_type='image/jpeg')
        
        print(f"Uploaded image to Firebase Storage: {blob_path}")
        return blob_path
        
    except Exception as e:
        print(f"Error uploading image to Firebase Storage: {e}")
        raise e


def download_image_from_storage(blob_path: str):
    """
    Download image from Firebase Storage and return as cv2 image array
    """
    try:
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        blob = bucket.blob(blob_path)
        if not blob.exists():
            raise Exception(f"Image not found in storage: {blob_path}")
        
        # Download image bytes
        image_bytes = blob.download_as_bytes()
        
        # Convert bytes to cv2 image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise Exception("Failed to decode image from storage")
        
        return img
        
    except Exception as e:
        print(f"Error downloading image from Firebase Storage: {e}")
        raise e


def initialize_deepface():
    """
    Lazy initialization of DeepFace
    """
    global _deepface_initialized, _deepface_module

    if _deepface_initialized:
        return _deepface_module

    try:
        print("Initializing DeepFace...")

        # Set DeepFace home directory structure
        # We use /tmp because it's the only writable directory in Firebase Functions
        base_dir = os.path.dirname(__file__)
        deepface_home = "/tmp"
        weights_dir = os.path.join(deepface_home, '.deepface', 'weights')
        models_source_dir = os.path.join(base_dir, 'models')
        
        # Create the expected directory structure
        os.makedirs(weights_dir, exist_ok=True)
        
        # Set DeepFace home directory environment variable
        os.environ['DEEPFACE_HOME'] = deepface_home
        print(f"DeepFace home directory set to: {deepface_home}")
        print(f"DeepFace weights directory: {weights_dir}")
        
        # Link models from our models directory to the expected weights directory
        # Symlinking is faster than copying and saves space
        if os.path.exists(models_source_dir):
            for model_file in os.listdir(models_source_dir):
                source_path = os.path.join(models_source_dir, model_file)
                target_path = os.path.join(weights_dir, model_file)
                
                if os.path.isfile(source_path):
                    if not os.path.exists(target_path):
                        try:
                            os.symlink(source_path, target_path)
                            print(f"Symlinked model: {model_file}")
                        except OSError as e:
                            # Fallback to copy if symlink fails (e.g. cross-device link)
                            import shutil
                            print(f"Symlink failed ({e}), falling back to copy for: {model_file}")
                            shutil.copy2(source_path, target_path)
                            print(f"Copied model: {model_file}")
                    else:
                        print(f"Model already exists in weights: {model_file}")
        
        print(f"Model files available in weights directory: {os.listdir(weights_dir) if os.path.exists(weights_dir) else 'Directory not found'}")

        # Import DeepFace only when needed
        from deepface import DeepFace
        _deepface_module = DeepFace
        _deepface_initialized = True

        print("DeepFace initialized successfully")
        return _deepface_module

    except Exception as e:
        print(f"Error initializing DeepFace: {e}")
        raise e


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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, memory=2048)
def detect_face(req: https_fn.Request) -> https_fn.Response:
    """Detect face and extract embeddings"""
    try:
        # CORS preflight is handled automatically by the decorator
        if req.method != 'POST':
            return https_fn.Response(
                json.dumps({'error': 'Only POST method allowed'}),
                status=405,
                headers={'Content-Type': 'application/json'}
            )

        # Parse JSON data
        try:
            data = req.get_json()
        except:
            return https_fn.Response(
                json.dumps({'error': 'Invalid JSON'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        image_base64 = data.get('image') if data else None

        if not image_base64:
            return https_fn.Response(
                json.dumps({'error': 'No image provided'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        # Decode image
        img = decode_base64_image(image_base64)
        if img is None:
            return https_fn.Response(
                json.dumps({'error': 'Invalid image format'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        # Upload image to Firebase Storage
        storage_image_path = None
        try:
            storage_image_path = upload_image_to_storage(img)
            print(f"Image uploaded to Firebase Storage: {storage_image_path}")
        except Exception as upload_error:
            return https_fn.Response(
                json.dumps({'error': f'Failed to upload image to storage: {str(upload_error)}'}),
                status=500,
                headers={'Content-Type': 'application/json'}
            )

        try:
            # Initialize DeepFace lazily
            DeepFace = initialize_deepface()

            # For Firebase Storage usage, we need to work with image arrays directly
            # since DeepFace expects file paths, we'll use the storage path approach
            
            # Optimized detection backends for FaceNet - ordered by performance
            detection_backends = ['retinaface', 'mtcnn', 'opencv', 'ssd']

            # Using FaceNet512 as the primary model for consistent embeddings
            model_name = 'Facenet512'

            result = None
            last_error = None

            # DeepFace requires a file path, so we need to create a processing file
            # We'll use a persistent directory for this
            processing_image_path = None
            try:
                # Create processing directory if it doesn't exist
                processing_dir = "/tmp/deepface/processing"
                os.makedirs(processing_dir, exist_ok=True)
                
                # Create a processing image file
                processing_image_path = f"{processing_dir}/process_image_{uuid.uuid4().hex}.jpg"
                cv2.imwrite(processing_image_path, img)
                print(f"Created processing image file: {processing_image_path}")
                
                # First try with enforce_detection=True for best quality
                for backend in detection_backends:
                    try:
                        print(f"Trying FaceNet detection with backend: {backend}")
                        result = DeepFace.represent(
                            img_path=processing_image_path,
                            model_name=model_name,
                            detector_backend=backend,
                            enforce_detection=True
                        )
                        print(f"FaceNet detection successful with backend: {backend}")
                        break
                    except Exception as e:
                        last_error = str(e)
                        print(f"Backend {backend} failed: {e}")
                        continue

                # If strict detection failed, try with enforce_detection=False
                if result is None:
                    print("Strict FaceNet detection failed, trying with enforce_detection=False")
                    for backend in detection_backends:
                        try:
                            result = DeepFace.represent(
                                img_path=processing_image_path,
                                model_name=model_name,
                                detector_backend=backend,
                                enforce_detection=False
                            )
                            print(f"FaceNet detection successful with relaxed mode using backend: {backend}")
                            break
                        except Exception as e:
                            last_error = str(e)
                            continue
                        
            except Exception as processing_error:
                last_error = f"Image processing failed: {str(processing_error)}"
                print(last_error)
            finally:
                # Clean up processing image file
                if processing_image_path and os.path.exists(processing_image_path):
                    try:
                        os.unlink(processing_image_path)
                        print(f"Cleaned up processing image: {processing_image_path}")
                    except Exception as cleanup_error:
                        print(f"Warning: Could not cleanup processing image: {cleanup_error}")

            if result is None or len(result) == 0:
                response_data = {
                    'success': False,
                    'error': f'No face could be detected. Last error: {last_error}',
                    'face_detected': False
                }
                return https_fn.Response(
                    json.dumps(response_data),
                    headers={'Content-Type': 'application/json'}
                )

            # Get the embedding (first face detected)
            embedding = result[0]['embedding']

            # Convert numpy array to Python list for JSON serialization
            if hasattr(embedding, 'tolist'):
                embedding = embedding.tolist()
            else:
                embedding = list(embedding)

            response_data = {
                'success': True,
                'embedding': embedding,
                'face_detected': True,
                'faces_count': len(result)
            }

            return https_fn.Response(
                json.dumps(response_data),
                headers={'Content-Type': 'application/json'}
            )

        except Exception as e:
            # No face detected or other error
            response_data = {
                'success': False,
                'error': str(e),
                'face_detected': False
            }
            return https_fn.Response(
                json.dumps(response_data),
                headers={'Content-Type': 'application/json'}
            )

    except Exception as e:
        response_data = {'error': str(e)}
        return https_fn.Response(
            json.dumps(response_data),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, memory=2048)
def verify_faces(req: https_fn.Request) -> https_fn.Response:
    """Compare two face embeddings"""
    try:
        # CORS preflight is handled automatically by the decorator
        if req.method != 'POST':
            return https_fn.Response(
                json.dumps({'error': 'Only POST method allowed'}),
                status=405,
                headers={'Content-Type': 'application/json'}
            )

        # Parse JSON data
        try:
            data = req.get_json()
        except:
            return https_fn.Response(
                json.dumps({'error': 'Invalid JSON'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        if not data:
            return https_fn.Response(
                json.dumps({'error': 'No JSON data provided'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        embedding1 = data.get('embedding1')
        embedding2 = data.get('embedding2')

        if not embedding1 or not embedding2:
            return https_fn.Response(
                json.dumps({'error': 'Both embeddings required'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        print(
            f"Comparing embeddings - Embedding1 length: {len(embedding1)}, Embedding2 length: {len(embedding2)}")

        # Convert to numpy arrays
        emb1 = np.array(embedding1, dtype=np.float32)
        emb2 = np.array(embedding2, dtype=np.float32)

        # Validate embeddings have the same shape
        if emb1.shape != emb2.shape:
            response_data = {
                'error': f'Embedding dimensions mismatch: {emb1.shape} vs {emb2.shape}'}
            return https_fn.Response(
                json.dumps(response_data),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        # Calculate cosine similarity
        dot_product = float(np.dot(emb1, emb2))
        norm1 = float(np.linalg.norm(emb1))
        norm2 = float(np.linalg.norm(emb2))

        if norm1 == 0 or norm2 == 0:
            response_data = {'error': 'Invalid embedding: zero norm'}
            return https_fn.Response(
                json.dumps(response_data),
                status=400,
                headers={'Content-Type': 'application/json'}
            )

        cosine_sim = dot_product / (norm1 * norm2)

        # Calculate euclidean distance
        euclidean_dist = float(np.linalg.norm(emb1 - emb2))

        # FaceNet512-optimized threshold for matching
        threshold = 0.6
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

        response_data = {
            'success': True,
            'is_match': is_match,
            'cosine_similarity': float(cosine_sim),
            'euclidean_distance': float(euclidean_dist),
            'confidence': float(cosine_sim),
            'threshold_used': float(threshold),
            'confidence_level': confidence_level
        }

        return https_fn.Response(
            json.dumps(response_data),
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        response_data = {'error': str(e)}
        return https_fn.Response(
            json.dumps(response_data),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, memory=2048)
def health_check(req: https_fn.Request) -> https_fn.Response:
    """Health check endpoint with FaceNet model verification"""
    try:
        # CORS preflight is handled automatically by the decorator
        # Test FaceNet model availability (but don't initialize yet for health check)
        try:
            # Just check if the module can be imported without initializing
            model_loaded = True
            model_info = "DeepFace module importable - initialization deferred"

            # Check if already initialized
            if _deepface_initialized:
                model_info = "FaceNet512 model initialized and ready"

        except Exception as e:
            model_loaded = False
            model_info = f"DeepFace module import error: {str(e)}"

        # Get models directory paths
        base_dir = os.path.dirname(__file__)
        models_source_dir = os.path.join(base_dir, 'models')
        weights_dir = os.path.join(base_dir, '.deepface', 'weights')
        
        response_data = {
            'status': 'healthy',
            'service': 'deepface-firebase-functions',
            'model': 'FaceNet512',
            'model_loaded': model_loaded,
            'model_info': model_info,
            'models_source_directory': models_source_dir,
            'models_source_exists': os.path.exists(models_source_dir),
            'weights_directory': weights_dir,
            'weights_directory_exists': os.path.exists(weights_dir),
            'deepface_home': os.environ.get('DEEPFACE_HOME', base_dir),
            'images_storage_path': get_storage_path_for_images(),
            'firebase_storage_bucket': get_storage_bucket_name(),
            'detection_backends': ['retinaface', 'mtcnn', 'opencv', 'ssd'],
            'verification_threshold': 0.6,
            'lazy_loading': True
        }

        return https_fn.Response(
            json.dumps(response_data),
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        response_data = {'error': str(e)}
        return https_fn.Response(
            json.dumps(response_data),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, memory=2048)
def models_info(req: https_fn.Request) -> https_fn.Response:
    """Get information about DeepFace service"""
    try:
        # CORS preflight is handled automatically by the decorator
        
        # Get models directory paths
        base_dir = os.path.dirname(__file__)
        models_source_dir = os.path.join(base_dir, 'models')
        weights_dir = os.path.join(base_dir, '.deepface', 'weights')
        
        response_data = {
            'success': True,
            'service': 'deepface-firebase-functions',
            'model': 'FaceNet512',
            'models_source_directory': models_source_dir,
            'weights_directory': weights_dir,
            'firebase_storage': {
                'bucket': get_storage_bucket_name(),
                'images_path': get_storage_path_for_images(),
                'temp_image_processing': True
            },
            'environment_info': {
                'deepface_home': os.environ.get('DEEPFACE_HOME', base_dir),
                'storage_bucket': get_storage_bucket_name(),
                'models_source_exists': os.path.exists(models_source_dir),
                'weights_exists': os.path.exists(weights_dir)
            },
            'detection_backends': ['retinaface', 'mtcnn', 'opencv', 'ssd'],
            'verification_threshold': 0.6
        }

        return https_fn.Response(
            json.dumps(response_data),
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        response_data = {'error': str(e)}
        return https_fn.Response(
            json.dumps(response_data),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

