import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/features/upload/services/upload_provider.dart';

class UploadForm extends StatelessWidget {
  const UploadForm({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UploadProvider>();

    return Column(
      children: [
        _buildTextField(
          context,
          provider.titleController, 
          '콘텐츠 제목', 
          '영상이나 이미지의 제목을 입력하세요', 
          Icons.title, 
          true
        ),
        const SizedBox(height: 24),
        _buildTextField(
          context,
          provider.descController, 
          '상세 설명', 
          '플랫폼에 표시될 설명을 작성하세요', 
          Icons.description, 
          false, 
          maxLines: 5
        ),
        const SizedBox(height: 24),
        _buildTextField(
          context,
          provider.tagsController, 
          '해시태그', 
          '쉼표(,)로 구분하여 입력 (예: shorts, ai, daily)', 
          Icons.tag, 
          false
        ),
      ],
    );
  }

  Widget _buildTextField(
    BuildContext context,
    TextEditingController controller, 
    String label, 
    String hint, 
    IconData icon, 
    bool required, 
    {int maxLines = 1}
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 20),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.primary, width: 2)),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
      ),
      validator: required ? (v) => v!.isEmpty ? '필수 입력 항목입니다.' : null : null,
    );
  }
}
