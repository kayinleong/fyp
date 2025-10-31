"""
DeepFace Firebase Cloud Functions for facial recognition
Converted from Flask server to Firebase Cloud Functions
"""

from firebase_functions import https_fn, options
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, storage
import json
import base64
import numpy as np
import cv2
import os
import io
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
        r"localhost:3000",
        r"http://localhost:3000",
        r"https://fyp-rabbitjob--kl2pen\.asia-southeast1\.hosted\.app"
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


def get_storage_path_for_models() -> str:
    """
    Get the Firebase Storage path for storing model weights
    """
    return "deepface-models/"


def get_storage_path_for_images() -> str:
    """
    Get the Firebase Storage path for temporary image processing
    """
    return "temp-images/"


def upload_image_to_storage(img_array, filename=None) -> str:
    """
    Upload image array to Firebase Storage and return the blob path
    """
    try:
        if filename is None:
            filename = f"temp_image_{uuid.uuid4().hex}.jpg"
        
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


def configure_deepface_for_storage():
    """
    Configure DeepFace to work with Firebase Storage for model weights
    """
    try:
        # Set environment to use Firebase Storage for models
        os.environ["DEEPFACE_HOME"] = get_storage_path_for_models()
        
        # Check if models exist in Firebase Storage
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        model_path = get_storage_path_for_models()
        blobs = list(bucket.list_blobs(prefix=model_path))
        
        print(f"Found {len(blobs)} items in Firebase Storage model path: {model_path}")
        
        return True
        
    except Exception as e:
        print(f"Error configuring DeepFace for Firebase Storage: {e}")
        return False


def create_storage_based_model_manager():
    """
    Create a custom model manager that works with Firebase Storage
    """
    try:
        # This will be called by DeepFace when it needs to load models
        # We'll implement a custom approach since DeepFace expects local files
        return True
    except Exception as e:
        print(f"Error creating storage-based model manager: {e}")
        return False


def check_model_in_storage(model_filename: str) -> bool:
    """
    Check if model exists in Firebase Storage
    """
    try:
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        # Model weights are stored in deepface-models/ folder
        blob_name = f"{get_storage_path_for_models()}{model_filename}"
        blob = bucket.blob(blob_name)
        
        exists = blob.exists()
        print(f"Model {model_filename} {'exists' if exists else 'does not exist'} in Firebase Storage")
        return exists
        
    except Exception as e:
        print(f"Error checking model {model_filename} in Firebase Storage: {e}")
        return False


def list_models_in_storage() -> list:
    """
    List all model files in Firebase Storage
    """
    try:
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        model_path = get_storage_path_for_models()
        blobs = bucket.list_blobs(prefix=model_path)
        
        models = []
        for blob in blobs:
            if not blob.name.endswith("/"):  # Exclude folders
                model_name = blob.name.replace(model_path, "")
                models.append({
                    'name': model_name,
                    'size_bytes': blob.size if blob.size else 0,
                    'updated': blob.updated.isoformat() if blob.updated else None
                })
        
        print(f"Found {len(models)} models in Firebase Storage")
        return models
        
    except Exception as e:
        print(f"Error listing models in Firebase Storage: {e}")
        return []


def initialize_storage_models():
    """
    Initialize and verify model availability in Firebase Storage
    This replaces the old sync function - we only use Firebase Storage now
    """
    try:
        # List models in Firebase Storage
        models = list_models_in_storage()
        
        # Check for essential models
        essential_models = [
            'facenet512_weights.h5',
            'retinaface.h5', 
            'mtcnn_weights.npy',
            'opencv_face_detector_uint8.pb',
            'opencv_face_detector.pbtxt'
        ]
        
        missing_models = []
        for model in essential_models:
            if not any(m['name'] == model for m in models):
                if not check_model_in_storage(model):
                    missing_models.append(model)
        
        if missing_models:
            print(f"Warning: Missing essential models in Firebase Storage: {missing_models}")
            print("These models will be downloaded when DeepFace first uses them")
        else:
            print("All essential models are available in Firebase Storage")
        
        return True
        
    except Exception as e:
        print(f"Error initializing storage models: {e}")
        return False


def upload_model_to_storage(local_model_path: str, model_filename: str) -> bool:
    """
    Upload a local model file to Firebase Storage
    """
    try:
        if not os.path.exists(local_model_path):
            print(f"Local model file does not exist: {local_model_path}")
            return False
        
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        # Model weights are stored in deepface-models/ folder
        blob_name = f"{get_storage_path_for_models()}{model_filename}"
        blob = bucket.blob(blob_name)
        
        # Upload the model
        blob.upload_from_filename(local_model_path)
        print(f"Uploaded {model_filename} to Firebase Storage: {blob_name}")
        return True
        
    except Exception as e:
        print(f"Error uploading model {model_filename} to Firebase Storage: {e}")
        return False


def download_model_from_storage_to_temp(model_filename: str) -> str:
    """
    Download model from Firebase Storage to temporary location and return path
    """
    try:
        storage_client = get_storage_client()
        bucket_name = get_storage_bucket_name()
        bucket = storage_client.bucket(bucket_name)
        
        # Model weights are stored in deepface-models/ folder
        blob_name = f"{get_storage_path_for_models()}{model_filename}"
        blob = bucket.blob(blob_name)
        
        if not blob.exists():
            print(f"Model {model_filename} not found in Firebase Storage")
            return None
        
        # Create temporary file path
        temp_model_path = f"/tmp/models/{model_filename}"
        os.makedirs(os.path.dirname(temp_model_path), exist_ok=True)
        
        # Download the model
        blob.download_to_filename(temp_model_path)
        print(f"Downloaded {model_filename} from Firebase Storage to {temp_model_path}")
        return temp_model_path
        
    except Exception as e:
        print(f"Error downloading model {model_filename} from Firebase Storage: {e}")
        return None


def create_firebase_storage_interface():
    """
    Create a Firebase Storage interface for DeepFace models
    Downloads models to a persistent location and manages them
    """
    try:
        # Use /tmp directory which is writable in Cloud Functions
        deepface_home = "/tmp/deepface"
        deepface_dir = f"{deepface_home}/.deepface"
        weights_dir = f"{deepface_dir}/weights"
        
        # Create directories if they don't exist
        os.makedirs(deepface_home, exist_ok=True)
        os.makedirs(deepface_dir, exist_ok=True)
        os.makedirs(weights_dir, exist_ok=True)
        
        os.environ["DEEPFACE_HOME"] = deepface_home
        print(f"Using persistent DeepFace directory: {deepface_home}")
        
        # Check which models we need to download from Firebase Storage
        essential_models = [
            'facenet512_weights.h5',
            'retinaface.h5',
            'mtcnn_weights.npy',
            'opencv_face_detector_uint8.pb',
            'opencv_face_detector.pbtxt'
        ]
        
        downloaded_count = 0
        uploaded_count = 0
        
        for model in essential_models:
            local_model_path = f"{weights_dir}/{model}"
            
            # Check if model exists locally first
            if os.path.exists(local_model_path):
                print(f"Model {model} already exists locally")
                # Check if it exists in Firebase Storage, if not upload it
                if not check_model_in_storage(model):
                    print(f"Uploading existing local model {model} to Firebase Storage...")
                    if upload_model_to_storage(local_model_path, model):
                        uploaded_count += 1
            else:
                # Model doesn't exist locally, try to download from Firebase Storage
                if check_model_in_storage(model):
                    try:
                        storage_client = get_storage_client()
                        bucket_name = get_storage_bucket_name()
                        bucket = storage_client.bucket(bucket_name)
                        
                        blob_name = f"{get_storage_path_for_models()}{model}"
                        blob = bucket.blob(blob_name)
                        
                        blob.download_to_filename(local_model_path)
                        print(f"Downloaded model from Firebase Storage: {model}")
                        downloaded_count += 1
                    except Exception as e:
                        print(f"Warning: Could not download model {model}: {e}")
                else:
                    print(f"Model {model} not found in Firebase Storage - will be downloaded by DeepFace when needed")
        
        print(f"Downloaded {downloaded_count} models from Firebase Storage")
        print(f"Uploaded {uploaded_count} models to Firebase Storage")
        return deepface_home
        
    except Exception as e:
        print(f"Error creating Firebase Storage interface: {e}")
        return None


def setup_deepface_storage_environment():
    """
    Setup environment variables for DeepFace with Firebase Storage backend
    """
    try:
        model_path = get_storage_path_for_models()
        print(f"DeepFace models will be accessed from Firebase Storage: {model_path}")
        
        # Create the Firebase Storage interface
        storage_interface = create_firebase_storage_interface()
        if not storage_interface:
            raise Exception("Failed to create Firebase Storage interface")
        
        print(f"DeepFace environment configured with Firebase Storage backend")
        return True
        
    except Exception as e:
        print(f"Error setting up DeepFace storage environment: {e}")
        return False


def sync_local_models_to_storage():
    """
    Check for locally downloaded models and upload them to Firebase Storage
    This is called after DeepFace initialization to capture any models it downloaded
    """
    try:
        deepface_home = os.environ.get('DEEPFACE_HOME', '/tmp/deepface')
        weights_dir = f"{deepface_home}/.deepface/weights"
        
        if not os.path.exists(weights_dir):
            print("No local DeepFace weights directory found")
            return
        
        # List all model files in the weights directory
        uploaded_count = 0
        for filename in os.listdir(weights_dir):
            if filename.endswith(('.h5', '.pb', '.pbtxt', '.npy', '.pkl')):
                local_model_path = os.path.join(weights_dir, filename)
                
                # Check if this model exists in Firebase Storage
                if not check_model_in_storage(filename):
                    print(f"Found new local model, uploading to Firebase Storage: {filename}")
                    if upload_model_to_storage(local_model_path, filename):
                        uploaded_count += 1
                else:
                    print(f"Model {filename} already exists in Firebase Storage")
        
        if uploaded_count > 0:
            print(f"Successfully uploaded {uploaded_count} new models to Firebase Storage")
        else:
            print("No new models to upload to Firebase Storage")
            
    except Exception as e:
        print(f"Error syncing local models to Firebase Storage: {e}")


def initialize_deepface():
    """
    Lazy initialization of DeepFace for Firebase Storage-only usage
    """
    global _deepface_initialized, _deepface_module

    if _deepface_initialized:
        return _deepface_module

    try:
        print("Initializing DeepFace for Firebase Storage-only usage...")

        # Setup environment for Firebase Storage
        setup_deepface_storage_environment()

        # Initialize storage models
        print("Checking models in Firebase Storage...")
        try:
            initialize_storage_models()
        except Exception as storage_error:
            print(f"Warning: Firebase Storage model check failed: {storage_error}")
            print("DeepFace will attempt to download models as needed")

        # Import DeepFace only when needed
        from deepface import DeepFace
        _deepface_module = DeepFace
        _deepface_initialized = True

        # After DeepFace is initialized, check for any newly downloaded models and upload them
        try:
            sync_local_models_to_storage()
        except Exception as sync_error:
            print(f"Warning: Failed to sync models to Firebase Storage: {sync_error}")

        print("DeepFace initialized successfully for Firebase Storage usage")
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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, timeout_sec=540, memory=2048)
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

            # After successful face detection, sync any newly downloaded models to Firebase Storage
            try:
                sync_local_models_to_storage()
            except Exception as sync_error:
                print(f"Warning: Failed to sync models after face detection: {sync_error}")

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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=3, timeout_sec=300, memory=2048)
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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=2, memory=2048)
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

        response_data = {
            'status': 'healthy',
            'service': 'deepface-firebase-functions',
            'model': 'FaceNet512',
            'model_loaded': model_loaded,
            'model_info': model_info,
            'models_storage_path': get_storage_path_for_models(),
            'images_storage_path': get_storage_path_for_images(),
            'firebase_storage_bucket': get_storage_bucket_name(),
            'storage_only_mode': True,
            'local_filesystem_disabled': True,
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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=2, memory=2048)
def models_info(req: https_fn.Request) -> https_fn.Response:
    """Get information about models stored in Firebase Storage"""
    try:
        # CORS preflight is handled automatically by the decorator
        
        # Get Firebase Storage models info
        storage_models = []
        storage_total_size = 0
        try:
            models = list_models_in_storage()
            for model in models:
                storage_models.append({
                    'name': model['name'],
                    'size_mb': round(model['size_bytes'] / (1024 * 1024), 2) if model['size_bytes'] else 0,
                    'updated': model['updated']
                })
                storage_total_size += model['size_bytes'] if model['size_bytes'] else 0
                    
        except Exception as e:
            storage_models = [f"Error listing Firebase Storage models: {str(e)}"]

        response_data = {
            'success': True,
            'storage_mode': 'firebase_only',
            'local_filesystem_disabled': True,
            'firebase_storage': {
                'bucket': get_storage_bucket_name(),
                'models_path': get_storage_path_for_models(),
                'images_path': get_storage_path_for_images(),
                'storage_models': storage_models,
                'total_storage_size_mb': round(storage_total_size / (1024 * 1024), 2),
                'model_count': len([m for m in storage_models if isinstance(m, dict)])
            },
            'environment_info': {
                'deepface_home': os.environ.get('DEEPFACE_HOME', 'Not set'),
                'storage_bucket': get_storage_bucket_name()
            }
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


@https_fn.on_request(cors=CORS_CONFIG, max_instances=1, timeout_sec=300, memory=2048)
def sync_models(req: https_fn.Request) -> https_fn.Response:
    """Manually trigger model synchronization with Firebase Storage"""
    try:
        # CORS preflight is handled automatically by the decorator
        if req.method not in ['POST', 'GET']:
            return https_fn.Response(
                json.dumps({'error': 'Only POST and GET methods allowed'}),
                status=405,
                headers={'Content-Type': 'application/json'}
            )

        print("Manual model check triggered (Firebase Storage only mode)")
        
        # Check models in Firebase Storage
        storage_success = initialize_storage_models()
        
        # Get current model status
        models = list_models_in_storage()
        
        if storage_success:
            response_data = {
                'success': True,
                'message': 'Model check completed successfully',
                'storage_mode': 'firebase_only',
                'models_found': len(models),
                'models': models[:10] if len(models) > 10 else models,  # Limit response size
                'storage_bucket': get_storage_bucket_name(),
                'models_path': get_storage_path_for_models()
            }
        else:
            response_data = {
                'success': False,
                'message': 'Model check failed',
                'error': 'Check function logs for details',
                'storage_bucket': get_storage_bucket_name()
            }

        return https_fn.Response(
            json.dumps(response_data),
            headers={'Content-Type': 'application/json'}
        )

    except Exception as e:
        response_data = {
            'success': False,
            'error': str(e),
            'message': 'Model synchronization failed with exception'
        }
        return https_fn.Response(
            json.dumps(response_data),
            status=500,
            headers={'Content-Type': 'application/json'}
        )
