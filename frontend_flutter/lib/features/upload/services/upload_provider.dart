import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:sns_uploader/core/network/api_client.dart';
import 'package:sns_uploader/core/external/file_service.dart';

class UploadProvider with ChangeNotifier {
  final TextEditingController titleController = TextEditingController();
  final TextEditingController descController = TextEditingController();
  final TextEditingController tagsController = TextEditingController();
  
  final Set<String> _selectedPlatforms = {};
  Set<String> get selectedPlatforms => _selectedPlatforms;

  PlatformFile? _selectedFile;
  PlatformFile? get selectedFile => _selectedFile;

  bool _isUploading = false;
  bool get isUploading => _isUploading;

  // Selectable platforms reference from UploadScreenState
  final List<String> allPlatformIds = [
    'facebook', 'youtube', 'youtube_shorts', 'instagram', 'tiktok', 'telegram', 
    'x', 'threads', 'linkedin', 'pinterest', 'snapchat', 'discord', 'slack', 
    'line', 'afreecatv', 'reddit', 'vimeo', 'behance', 'dribbble', 'medium', 
    'wordpress', 'naver_blog', 'naver_cafe'
  ];

  bool get isAllSelected => _selectedPlatforms.length == allPlatformIds.length;

  void togglePlatform(String id) {
    if (_selectedPlatforms.contains(id)) {
      _selectedPlatforms.remove(id);
    } else {
      _selectedPlatforms.add(id);
    }
    notifyListeners();
  }

  void toggleAll() {
    if (isAllSelected) {
      _selectedPlatforms.clear();
    } else {
      _selectedPlatforms.addAll(allPlatformIds);
    }
    notifyListeners();
  }

  Future<void> pickFile() async {
    try {
      final file = await FileService().pickMediaFile();
      if (file != null) {
        _selectedFile = file;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('파일 선택 오류: $e');
      rethrow;
    }
  }

  Future<void> startUpload() async {
    if (_selectedFile == null || _selectedPlatforms.isEmpty) {
      throw Exception('파일과 플랫폼을 먼저 선택해 주세요.');
    }

    _isUploading = true;
    notifyListeners();

    try {
      final dio = ApiClient().dio;
      final formData = FormData.fromMap({
        'title': titleController.text,
        'description': descController.text,
        'tags': tagsController.text,
        'platforms': _selectedPlatforms.join(','),
        'file': MultipartFile.fromBytes(_selectedFile!.bytes!, filename: _selectedFile!.name),
      });

      await dio.post('/api/v1/jobs/upload', data: formData);

      _selectedFile = null;
      titleController.clear();
      descController.clear();
      tagsController.clear();
      _selectedPlatforms.clear();
      
    } catch (e) {
      debugPrint('업로드 실패: $e');
      rethrow;
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    descController.dispose();
    tagsController.dispose();
    super.dispose();
  }
}
