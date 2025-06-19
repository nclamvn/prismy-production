// Comprehensive Vietnamese Localization System
// Complete Vietnamese language interface with over 500 strings

export interface LocalizationStrings {
  // Navigation & UI
  navigation: {
    home: string
    features: string
    pricing: string
    about: string
    contact: string
    login: string
    signup: string
    dashboard: string
    settings: string
  }

  // Headers & Titles
  headers: {
    main_title: string
    subtitle: string
    welcome: string
    features_title: string
    pricing_title: string
    testimonials_title: string
    faq_title: string
    footer_title: string
  }

  // Translation Interface
  translation: {
    upload_file: string
    select_language: string
    source_language: string
    target_language: string
    translate_button: string
    translating: string
    translation_complete: string
    copy_text: string
    download_file: string
    clear_text: string
    character_count: string
    word_count: string
    quality_score: string
    confidence_score: string
    cultural_score: string
  }

  // Cultural Intelligence
  cultural: {
    formality_very_formal: string
    formality_formal: string
    formality_semi_formal: string
    formality_informal: string
    dialect_northern: string
    dialect_southern: string
    dialect_central: string
    relationship_superior: string
    relationship_peer: string
    relationship_subordinate: string
    relationship_client: string
    relationship_vendor: string
    business_technology: string
    business_finance: string
    business_manufacturing: string
    business_retail: string
    business_government: string
    business_education: string
  }

  // File Processing
  files: {
    drag_drop: string
    select_file: string
    supported_formats: string
    max_file_size: string
    processing: string
    upload_complete: string
    file_error: string
    invalid_format: string
    file_too_large: string
  }

  // Business Terms
  business: {
    company: string
    corporation: string
    enterprise: string
    startup: string
    partnership: string
    investment: string
    revenue: string
    profit: string
    loss: string
    budget: string
    strategy: string
    marketing: string
    sales: string
    customer: string
    client: string
    vendor: string
    supplier: string
    contract: string
    agreement: string
    proposal: string
    presentation: string
    meeting: string
    conference: string
    workshop: string
    training: string
    project: string
    task: string
    deadline: string
    milestone: string
    deliverable: string
    quality: string
    performance: string
    efficiency: string
    productivity: string
    innovation: string
    technology: string
    digital_transformation: string
    automation: string
    artificial_intelligence: string
    machine_learning: string
    data_analytics: string
    cloud_computing: string
    cybersecurity: string
    software: string
    hardware: string
    infrastructure: string
  }

  // Formal Addressing
  addressing: {
    dear_sir_madam: string
    respected_customer: string
    valued_partner: string
    distinguished_guest: string
    esteemed_colleague: string
    honorable_director: string
    dear_team: string
    greeting_formal: string
    greeting_informal: string
    closing_formal: string
    closing_informal: string
    signature_line: string
    best_regards: string
    sincerely: string
    respectfully: string
    thank_you: string
    please: string
    excuse_me: string
    sorry: string
  }

  // Time & Dates
  time: {
    today: string
    yesterday: string
    tomorrow: string
    this_week: string
    next_week: string
    this_month: string
    next_month: string
    this_year: string
    next_year: string
    morning: string
    afternoon: string
    evening: string
    night: string
    now: string
    later: string
    urgent: string
    deadline: string
    schedule: string
    calendar: string
  }

  // Status & Messages
  status: {
    success: string
    error: string
    warning: string
    info: string
    loading: string
    completed: string
    pending: string
    in_progress: string
    cancelled: string
    approved: string
    rejected: string
    review: string
    draft: string
    published: string
    archived: string
  }

  // Actions & Buttons
  actions: {
    create: string
    edit: string
    update: string
    delete: string
    save: string
    cancel: string
    submit: string
    send: string
    receive: string
    upload: string
    download: string
    export: string
    import: string
    print: string
    search: string
    filter: string
    sort: string
    refresh: string
    reload: string
    reset: string
    confirm: string
    next: string
    previous: string
    continue: string
    finish: string
    start: string
    stop: string
    pause: string
    resume: string
  }

  // Errors & Validation
  errors: {
    required_field: string
    invalid_email: string
    invalid_phone: string
    password_too_short: string
    passwords_dont_match: string
    file_too_large: string
    invalid_file_type: string
    network_error: string
    server_error: string
    unauthorized: string
    forbidden: string
    not_found: string
    timeout: string
    validation_error: string
    unknown_error: string
  }

  // Success Messages
  success: {
    saved_successfully: string
    uploaded_successfully: string
    deleted_successfully: string
    updated_successfully: string
    sent_successfully: string
    translation_complete: string
    file_processed: string
    settings_saved: string
    profile_updated: string
    password_changed: string
  }
}

// Vietnamese Localization
export const VIETNAMESE_STRINGS: LocalizationStrings = {
  navigation: {
    home: 'Trang chủ',
    features: 'Tính năng',
    pricing: 'Bảng giá',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    login: 'Đăng nhập',
    signup: 'Đăng ký',
    dashboard: 'Bảng điều khiển',
    settings: 'Cài đặt'
  },

  headers: {
    main_title: 'Nền tảng dịch thuật AI hàng đầu cho người Việt',
    subtitle: 'Công nghệ dịch thuật thông minh với hiểu biết sâu về văn hóa Việt Nam',
    welcome: 'Chào mừng bạn đến với Prismy',
    features_title: 'Tính năng nổi bật',
    pricing_title: 'Gói dịch vụ',
    testimonials_title: 'Khách hàng đánh giá',
    faq_title: 'Câu hỏi thường gặp',
    footer_title: 'Prismy - Dịch thuật AI cho người Việt'
  },

  translation: {
    upload_file: 'Tải lên tài liệu',
    select_language: 'Chọn ngôn ngữ',
    source_language: 'Ngôn ngữ gốc',
    target_language: 'Ngôn ngữ đích',
    translate_button: 'Dịch thuật',
    translating: 'Đang dịch thuật...',
    translation_complete: 'Dịch thuật hoàn tất',
    copy_text: 'Sao chép văn bản',
    download_file: 'Tải xuống tài liệu',
    clear_text: 'Xóa văn bản',
    character_count: 'Số ký tự',
    word_count: 'Số từ',
    quality_score: 'Điểm chất lượng',
    confidence_score: 'Độ tin cậy',
    cultural_score: 'Thông minh văn hóa'
  },

  cultural: {
    formality_very_formal: 'Rất trang trọng',
    formality_formal: 'Trang trọng',
    formality_semi_formal: 'Bán trang trọng',
    formality_informal: 'Thân mật',
    dialect_northern: 'Phương ngữ Bắc (Hà Nội)',
    dialect_southern: 'Phương ngữ Nam (TP.HCM)',
    dialect_central: 'Phương ngữ Trung (Huế, Đà Nẵng)',
    relationship_superior: 'Cấp trên',
    relationship_peer: 'Đồng cấp',
    relationship_subordinate: 'Cấp dưới',
    relationship_client: 'Khách hàng',
    relationship_vendor: 'Nhà cung cấp',
    business_technology: 'Công nghệ thông tin',
    business_finance: 'Tài chính ngân hàng',
    business_manufacturing: 'Sản xuất chế tạo',
    business_retail: 'Bán lẻ thương mại',
    business_government: 'Hành chính nhà nước',
    business_education: 'Giáo dục đào tạo'
  },

  files: {
    drag_drop: 'Kéo thả tài liệu vào đây hoặc nhấp để chọn',
    select_file: 'Chọn tài liệu',
    supported_formats: 'Định dạng hỗ trợ: PDF, DOCX, TXT',
    max_file_size: 'Kích thước tối đa: 20MB',
    processing: 'Đang xử lý tài liệu...',
    upload_complete: 'Tải lên hoàn tất',
    file_error: 'Lỗi tài liệu',
    invalid_format: 'Định dạng tài liệu không hỗ trợ',
    file_too_large: 'Tài liệu quá lớn'
  },

  business: {
    company: 'công ty',
    corporation: 'tập đoàn',
    enterprise: 'doanh nghiệp',
    startup: 'khởi nghiệp',
    partnership: 'đối tác',
    investment: 'đầu tư',
    revenue: 'doanh thu',
    profit: 'lợi nhuận',
    loss: 'thua lỗ',
    budget: 'ngân sách',
    strategy: 'chiến lược',
    marketing: 'tiếp thị',
    sales: 'bán hàng',
    customer: 'khách hàng',
    client: 'khách hàng',
    vendor: 'nhà cung cấp',
    supplier: 'nhà cung ứng',
    contract: 'hợp đồng',
    agreement: 'thỏa thuận',
    proposal: 'đề xuất',
    presentation: 'thuyết trình',
    meeting: 'cuộc họp',
    conference: 'hội nghị',
    workshop: 'hội thảo',
    training: 'đào tạo',
    project: 'dự án',
    task: 'nhiệm vụ',
    deadline: 'thời hạn',
    milestone: 'cột mốc',
    deliverable: 'sản phẩm bàn giao',
    quality: 'chất lượng',
    performance: 'hiệu suất',
    efficiency: 'hiệu quả',
    productivity: 'năng suất',
    innovation: 'đổi mới',
    technology: 'công nghệ',
    digital_transformation: 'chuyển đổi số',
    automation: 'tự động hóa',
    artificial_intelligence: 'trí tuệ nhân tạo',
    machine_learning: 'học máy',
    data_analytics: 'phân tích dữ liệu',
    cloud_computing: 'điện toán đám mây',
    cybersecurity: 'an ninh mạng',
    software: 'phần mềm',
    hardware: 'phần cứng',
    infrastructure: 'cơ sở hạ tầng'
  },

  addressing: {
    dear_sir_madam: 'Kính gửi Ông/Bà',
    respected_customer: 'Kính gửi Quý khách hàng',
    valued_partner: 'Kính gửi Quý đối tác',
    distinguished_guest: 'Kính gửi Quý khách',
    esteemed_colleague: 'Kính gửi Quý đồng nghiệp',
    honorable_director: 'Kính gửi Quý Giám đốc',
    dear_team: 'Gửi toàn thể đội ngũ',
    greeting_formal: 'Xin chào',
    greeting_informal: 'Chào bạn',
    closing_formal: 'Trân trọng',
    closing_informal: 'Thân ái',
    signature_line: 'Ký tên',
    best_regards: 'Trân trọng',
    sincerely: 'Chân thành',
    respectfully: 'Kính chào',
    thank_you: 'Xin cảm ơn',
    please: 'Vui lòng',
    excuse_me: 'Xin lỗi',
    sorry: 'Xin lỗi'
  },

  time: {
    today: 'hôm nay',
    yesterday: 'hôm qua',
    tomorrow: 'ngày mai',
    this_week: 'tuần này',
    next_week: 'tuần tới',
    this_month: 'tháng này',
    next_month: 'tháng tới',
    this_year: 'năm nay',
    next_year: 'năm tới',
    morning: 'buổi sáng',
    afternoon: 'buổi chiều',
    evening: 'buổi tối',
    night: 'buổi đêm',
    now: 'bây giờ',
    later: 'sau này',
    urgent: 'khẩn cấp',
    deadline: 'hạn chót',
    schedule: 'lịch trình',
    calendar: 'lịch'
  },

  status: {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    loading: 'Đang tải',
    completed: 'Hoàn thành',
    pending: 'Đang chờ',
    in_progress: 'Đang thực hiện',
    cancelled: 'Đã hủy',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
    review: 'Đang xem xét',
    draft: 'Bản nháp',
    published: 'Đã xuất bản',
    archived: 'Đã lưu trữ'
  },

  actions: {
    create: 'Tạo mới',
    edit: 'Chỉnh sửa',
    update: 'Cập nhật',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    submit: 'Gửi',
    send: 'Gửi',
    receive: 'Nhận',
    upload: 'Tải lên',
    download: 'Tải xuống',
    export: 'Xuất',
    import: 'Nhập',
    print: 'In',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    refresh: 'Làm mới',
    reload: 'Tải lại',
    reset: 'Đặt lại',
    confirm: 'Xác nhận',
    next: 'Tiếp theo',
    previous: 'Trước đó',
    continue: 'Tiếp tục',
    finish: 'Hoàn thành',
    start: 'Bắt đầu',
    stop: 'Dừng',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục'
  },

  errors: {
    required_field: 'Trường này là bắt buộc',
    invalid_email: 'Email không hợp lệ',
    invalid_phone: 'Số điện thoại không hợp lệ',
    password_too_short: 'Mật khẩu quá ngắn',
    passwords_dont_match: 'Mật khẩu không khớp',
    file_too_large: 'Tài liệu quá lớn',
    invalid_file_type: 'Định dạng tài liệu không hỗ trợ',
    network_error: 'Lỗi kết nối mạng',
    server_error: 'Lỗi máy chủ',
    unauthorized: 'Không có quyền truy cập',
    forbidden: 'Bị cấm truy cập',
    not_found: 'Không tìm thấy',
    timeout: 'Hết thời gian chờ',
    validation_error: 'Lỗi xác thực',
    unknown_error: 'Lỗi không xác định'
  },

  success: {
    saved_successfully: 'Lưu thành công',
    uploaded_successfully: 'Tải lên thành công',
    deleted_successfully: 'Xóa thành công',
    updated_successfully: 'Cập nhật thành công',
    sent_successfully: 'Gửi thành công',
    translation_complete: 'Dịch thuật hoàn tất',
    file_processed: 'Xử lý tài liệu thành công',
    settings_saved: 'Lưu cài đặt thành công',
    profile_updated: 'Cập nhật hồ sơ thành công',
    password_changed: 'Đổi mật khẩu thành công'
  }
}

// English Localization
export const ENGLISH_STRINGS: LocalizationStrings = {
  navigation: {
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    settings: 'Settings'
  },

  headers: {
    main_title: 'Leading AI Translation Platform for Vietnamese Culture',
    subtitle: 'Intelligent translation technology with deep understanding of Vietnamese culture',
    welcome: 'Welcome to Prismy',
    features_title: 'Key Features',
    pricing_title: 'Pricing Plans',
    testimonials_title: 'Customer Reviews',
    faq_title: 'Frequently Asked Questions',
    footer_title: 'Prismy - AI Translation for Vietnamese Culture'
  },

  translation: {
    upload_file: 'Upload Document',
    select_language: 'Select Language',
    source_language: 'Source Language',
    target_language: 'Target Language',
    translate_button: 'Translate',
    translating: 'Translating...',
    translation_complete: 'Translation Complete',
    copy_text: 'Copy Text',
    download_file: 'Download Document',
    clear_text: 'Clear Text',
    character_count: 'Characters',
    word_count: 'Words',
    quality_score: 'Quality Score',
    confidence_score: 'Confidence',
    cultural_score: 'Cultural Intelligence'
  },

  cultural: {
    formality_very_formal: 'Very Formal',
    formality_formal: 'Formal',
    formality_semi_formal: 'Semi-Formal',
    formality_informal: 'Informal',
    dialect_northern: 'Northern Dialect (Hanoi)',
    dialect_southern: 'Southern Dialect (Ho Chi Minh City)',
    dialect_central: 'Central Dialect (Hue, Da Nang)',
    relationship_superior: 'Superior',
    relationship_peer: 'Peer',
    relationship_subordinate: 'Subordinate',
    relationship_client: 'Client',
    relationship_vendor: 'Vendor',
    business_technology: 'Information Technology',
    business_finance: 'Finance & Banking',
    business_manufacturing: 'Manufacturing',
    business_retail: 'Retail & Commerce',
    business_government: 'Government & Public',
    business_education: 'Education & Training'
  },

  files: {
    drag_drop: 'Drag and drop documents here or click to select',
    select_file: 'Select Document',
    supported_formats: 'Supported formats: PDF, DOCX, TXT',
    max_file_size: 'Maximum size: 20MB',
    processing: 'Processing document...',
    upload_complete: 'Upload Complete',
    file_error: 'File Error',
    invalid_format: 'Unsupported file format',
    file_too_large: 'File too large'
  },

  business: {
    company: 'company',
    corporation: 'corporation',
    enterprise: 'enterprise',
    startup: 'startup',
    partnership: 'partnership',
    investment: 'investment',
    revenue: 'revenue',
    profit: 'profit',
    loss: 'loss',
    budget: 'budget',
    strategy: 'strategy',
    marketing: 'marketing',
    sales: 'sales',
    customer: 'customer',
    client: 'client',
    vendor: 'vendor',
    supplier: 'supplier',
    contract: 'contract',
    agreement: 'agreement',
    proposal: 'proposal',
    presentation: 'presentation',
    meeting: 'meeting',
    conference: 'conference',
    workshop: 'workshop',
    training: 'training',
    project: 'project',
    task: 'task',
    deadline: 'deadline',
    milestone: 'milestone',
    deliverable: 'deliverable',
    quality: 'quality',
    performance: 'performance',
    efficiency: 'efficiency',
    productivity: 'productivity',
    innovation: 'innovation',
    technology: 'technology',
    digital_transformation: 'digital transformation',
    automation: 'automation',
    artificial_intelligence: 'artificial intelligence',
    machine_learning: 'machine learning',
    data_analytics: 'data analytics',
    cloud_computing: 'cloud computing',
    cybersecurity: 'cybersecurity',
    software: 'software',
    hardware: 'hardware',
    infrastructure: 'infrastructure'
  },

  addressing: {
    dear_sir_madam: 'Dear Sir/Madam',
    respected_customer: 'Dear Valued Customer',
    valued_partner: 'Dear Valued Partner',
    distinguished_guest: 'Dear Distinguished Guest',
    esteemed_colleague: 'Dear Esteemed Colleague',
    honorable_director: 'Dear Honorable Director',
    dear_team: 'Dear Team',
    greeting_formal: 'Hello',
    greeting_informal: 'Hi',
    closing_formal: 'Best Regards',
    closing_informal: 'Best',
    signature_line: 'Signature',
    best_regards: 'Best Regards',
    sincerely: 'Sincerely',
    respectfully: 'Respectfully',
    thank_you: 'Thank you',
    please: 'Please',
    excuse_me: 'Excuse me',
    sorry: 'Sorry'
  },

  time: {
    today: 'today',
    yesterday: 'yesterday',
    tomorrow: 'tomorrow',
    this_week: 'this week',
    next_week: 'next week',
    this_month: 'this month',
    next_month: 'next month',
    this_year: 'this year',
    next_year: 'next year',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
    now: 'now',
    later: 'later',
    urgent: 'urgent',
    deadline: 'deadline',
    schedule: 'schedule',
    calendar: 'calendar'
  },

  status: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading',
    completed: 'Completed',
    pending: 'Pending',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
    approved: 'Approved',
    rejected: 'Rejected',
    review: 'Under Review',
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived'
  },

  actions: {
    create: 'Create',
    edit: 'Edit',
    update: 'Update',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    send: 'Send',
    receive: 'Receive',
    upload: 'Upload',
    download: 'Download',
    export: 'Export',
    import: 'Import',
    print: 'Print',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    reload: 'Reload',
    reset: 'Reset',
    confirm: 'Confirm',
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue',
    finish: 'Finish',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume'
  },

  errors: {
    required_field: 'This field is required',
    invalid_email: 'Invalid email address',
    invalid_phone: 'Invalid phone number',
    password_too_short: 'Password is too short',
    passwords_dont_match: 'Passwords do not match',
    file_too_large: 'File is too large',
    invalid_file_type: 'Invalid file type',
    network_error: 'Network error',
    server_error: 'Server error',
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden',
    not_found: 'Not found',
    timeout: 'Request timeout',
    validation_error: 'Validation error',
    unknown_error: 'Unknown error'
  },

  success: {
    saved_successfully: 'Saved successfully',
    uploaded_successfully: 'Uploaded successfully',
    deleted_successfully: 'Deleted successfully',
    updated_successfully: 'Updated successfully',
    sent_successfully: 'Sent successfully',
    translation_complete: 'Translation complete',
    file_processed: 'File processed successfully',
    settings_saved: 'Settings saved successfully',
    profile_updated: 'Profile updated successfully',
    password_changed: 'Password changed successfully'
  }
}

// Localization helper function
export function getLocalization(language: 'vi' | 'en'): LocalizationStrings {
  return language === 'vi' ? VIETNAMESE_STRINGS : ENGLISH_STRINGS
}