import 'package:flutter/material.dart';
import 'package:sns_uploader/core/network/api_client.dart';
import 'package:sns_uploader/features/media_library/models/media_models.dart';
import 'package:dio/dio.dart';

class MediaLibraryProvider with ChangeNotifier {
  List<MediaProject> _projects = [];
  List<MediaProject> get projects => _projects;

  List<MediaAsset> _currentAssets = [];
  List<MediaAsset> get currentAssets => _currentAssets;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  final String _endpoint = '/api/v1/media';

  Future<void> fetchProjects() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiClient().dio.get('$_endpoint/projects');
      if (response.statusCode == 200) {
        final List data = response.data;
        _projects = data.map((json) => MediaProject.fromJson(json)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAssetsForProject(int projectId) async {
    _isLoading = true;
    _error = null;
    _currentAssets = [];
    notifyListeners();

    try {
      final response = await ApiClient().dio.get('$_endpoint/projects/$projectId/assets');
      if (response.statusCode == 200) {
        final List data = response.data;
        _currentAssets = data.map((json) => MediaAsset.fromJson(json)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createProject(String title, String description) async {
    try {
      final formData = FormData.fromMap({
        'title': title,
        'description': description,
      });
      await ApiClient().dio.post('$_endpoint/projects', data: formData);
      await fetchProjects();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteProject(int projectId) async {
    try {
      await ApiClient().dio.delete('$_endpoint/projects/$projectId');
      await fetchProjects();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteAsset(int assetId, int? projectId) async {
    try {
      await ApiClient().dio.delete('$_endpoint/assets/$assetId');
      if (projectId != null) {
        await fetchAssetsForProject(projectId);
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
