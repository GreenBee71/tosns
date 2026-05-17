import 'package:file_picker/file_picker.dart';

class FileService {
  static final FileService _instance = FileService._internal();
  factory FileService() => _instance;
  FileService._internal();

  /// Picks a single media file from the device.
  /// This wrapper helps in case we need to switch from file_picker to another 
  /// plugin or handle platform-specific issues (like WASM/JS compatibility).
  Future<PlatformFile?> pickMediaFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp4', 'png', 'jpg', 'jpeg'],
        withData: true, 
      );
      return result?.files.first;
    } catch (e) {
      rethrow;
    }
  }
}
