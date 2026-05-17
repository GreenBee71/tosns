class MediaProject {
  final int id;
  final String title;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int assetCount;

  MediaProject({
    required this.id,
    required this.title,
    required this.description,
    required this.createdAt,
    required this.updatedAt,
    this.assetCount = 0,
  });

  factory MediaProject.fromJson(Map<String, dynamic> json) {
    return MediaProject(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      assetCount: json['asset_count'] ?? 0,
    );
  }
}

class MediaAsset {
  final int id;
  final int? projectId;
  final String assetType;
  final String filePath;
  final String? prompt;
  final DateTime createdAt;

  MediaAsset({
    required this.id,
    this.projectId,
    required this.assetType,
    required this.filePath,
    this.prompt,
    required this.createdAt,
  });

  factory MediaAsset.fromJson(Map<String, dynamic> json) {
    return MediaAsset(
      id: json['id'],
      projectId: json['project_id'],
      assetType: json['asset_type'],
      filePath: json['file_path'],
      prompt: json['prompt'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  String get fullUrl {
    // Backend paths are like "media/library/1/file.jpg"
    // Static mount in main.py is "/media" for "media" directory
    return 'https://tosns.greenbee.cloud/$filePath';
  }
}
