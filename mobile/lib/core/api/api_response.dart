class ApiResponse<T> {
  ApiResponse({
    required this.success,
    this.data,
    this.error,
  });

  final bool success;
  final T? data;
  final ApiError? error;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? parser,
  ) {
    return ApiResponse(
      success: json['success'] == true,
      data: json['data'] != null && parser != null
          ? parser(json['data'])
          : json['data'] as T?,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiError {
  ApiError({required this.code, required this.message, this.details});

  final String code;
  final String message;
  final Map<String, dynamic>? details;

  factory ApiError.fromJson(Map<String, dynamic> json) => ApiError(
        code: json['code'] as String? ?? 'ERROR',
        message: json['message'] as String? ?? 'Unknown error',
        details: json['details'] as Map<String, dynamic>?,
      );
}
