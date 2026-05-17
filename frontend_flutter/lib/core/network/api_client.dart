import 'package:dio/dio.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  
  factory ApiClient() {
    return _instance;
  }
  
  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: 'https://tosns.greenbee.cloud',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Here we can inject Auth tokens in the future
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        // Can add global error handling, logging, toast messages
        return handler.next(e);
      },
    ));
  }
}
