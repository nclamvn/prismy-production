// Vietnamese Business Terminology Database
// Comprehensive database for Vietnamese business communication

export interface TerminologyEntry {
  english: string
  vietnamese: {
    formal: string
    informal: string
    business: string
    technical?: string
  }
  context: string[]
  usage: string
  examples: {
    english: string
    vietnamese: string
  }[]
}

export interface AddressingSystem {
  relationship: string
  context: 'formal' | 'business' | 'casual'
  speaker: {
    gender: 'male' | 'female' | 'neutral'
    age: 'younger' | 'older' | 'same'
  }
  addressee: {
    gender: 'male' | 'female' | 'neutral'
    age: 'younger' | 'older' | 'same'
    position?: 'superior' | 'equal' | 'junior'
  }
  forms: {
    self: string[]
    other: string[]
  }
}

// Vietnamese Business Terminology Database
export const VIETNAMESE_TERMINOLOGY: TerminologyEntry[] = [
  // Leadership & Management
  {
    english: 'CEO',
    vietnamese: {
      formal: 'Tổng Giám đốc Điều hành',
      informal: 'Giám đốc điều hành',
      business: 'CEO',
      technical: 'Giám đốc điều hành tổng công ty'
    },
    context: ['business', 'corporate', 'management'],
    usage: 'Used in formal business communications and corporate hierarchy',
    examples: [
      {
        english: 'The CEO will attend the meeting',
        vietnamese: 'Tổng Giám đốc Điều hành sẽ tham dự cuộc họp'
      }
    ]
  },
  {
    english: 'Manager',
    vietnamese: {
      formal: 'Quản lý',
      informal: 'Trưởng phòng',
      business: 'Giám đốc bộ phận'
    },
    context: ['management', 'department', 'supervision'],
    usage: 'Varies by company size and structure',
    examples: [
      {
        english: 'Please contact your manager',
        vietnamese: 'Vui lòng liên hệ với Quản lý của bạn'
      }
    ]
  },
  {
    english: 'Employee',
    vietnamese: {
      formal: 'Nhân viên',
      informal: 'Người làm việc',
      business: 'Cán bộ công nhân viên'
    },
    context: ['workforce', 'staff', 'personnel'],
    usage: 'Standard term for workers at all levels',
    examples: [
      {
        english: 'All employees must attend training',
        vietnamese: 'Tất cả nhân viên phải tham gia đào tạo'
      }
    ]
  },
  
  // Financial Terms
  {
    english: 'Revenue',
    vietnamese: {
      formal: 'Doanh thu',
      informal: 'Thu nhập',
      business: 'Tổng doanh thu'
    },
    context: ['finance', 'accounting', 'business performance'],
    usage: 'Key financial metric in business reporting',
    examples: [
      {
        english: 'Our revenue increased by 20%',
        vietnamese: 'Doanh thu của chúng tôi tăng 20%'
      }
    ]
  },
  {
    english: 'Profit',
    vietnamese: {
      formal: 'Lợi nhuận',
      informal: 'Lãi',
      business: 'Lợi nhuận ròng'
    },
    context: ['finance', 'profitability', 'earnings'],
    usage: 'Essential business performance indicator',
    examples: [
      {
        english: 'We achieved record profits this quarter',
        vietnamese: 'Chúng tôi đạt được lợi nhuận kỷ lục trong quý này'
      }
    ]
  },
  {
    english: 'Investment',
    vietnamese: {
      formal: 'Đầu tư',
      informal: 'Bỏ vốn',
      business: 'Khoản đầu tư'
    },
    context: ['finance', 'capital', 'growth'],
    usage: 'Used in financial planning and business development',
    examples: [
      {
        english: 'We need more investment in technology',
        vietnamese: 'Chúng ta cần đầu tư thêm vào công nghệ'
      }
    ]
  },

  // Technology & Innovation
  {
    english: 'Digital Transformation',
    vietnamese: {
      formal: 'Chuyển đổi số',
      informal: 'Số hóa',
      business: 'Chuyển đổi số toàn diện'
    },
    context: ['technology', 'modernization', 'digitalization'],
    usage: 'Major trend in Vietnamese business modernization',
    examples: [
      {
        english: 'Digital transformation is our priority',
        vietnamese: 'Chuyển đổi số là ưu tiên hàng đầu của chúng tôi'
      }
    ]
  },
  
  // Customer Relations
  {
    english: 'Customer',
    vietnamese: {
      formal: 'Khách hàng',
      informal: 'Khách',
      business: 'Quý khách hàng'
    },
    context: ['service', 'sales', 'relationship'],
    usage: 'Respectful term essential in Vietnamese business culture',
    examples: [
      {
        english: 'Our customers are our priority',
        vietnamese: 'Khách hàng là ưu tiên hàng đầu của chúng tôi'
      }
    ]
  }
]

// Vietnamese Formal Addressing System
export const VIETNAMESE_ADDRESSING: AddressingSystem[] = [
  // Business - Formal Superior
  {
    relationship: 'business_superior',
    context: 'formal',
    speaker: { gender: 'neutral', age: 'younger' },
    addressee: { gender: 'neutral', age: 'older', position: 'superior' },
    forms: {
      self: ['em', 'con', 'cháu'],
      other: ['anh', 'chị', 'ông', 'bà']
    }
  },
  
  // Business - Peer Level
  {
    relationship: 'business_peer',
    context: 'business',
    speaker: { gender: 'neutral', age: 'same' },
    addressee: { gender: 'neutral', age: 'same', position: 'equal' },
    forms: {
      self: ['tôi', 'mình'],
      other: ['bạn', 'anh', 'chị']
    }
  },
  
  // Customer Service
  {
    relationship: 'customer_service',
    context: 'formal',
    speaker: { gender: 'neutral', age: 'younger' },
    addressee: { gender: 'neutral', age: 'older', position: 'superior' },
    forms: {
      self: ['em', 'chúng em', 'chúng tôi'],
      other: ['quý khách', 'anh', 'chị', 'quý ông', 'quý bà']
    }
  }
]

// Regional Dialect Variations
export const DIALECT_VARIATIONS = {
  northern: {
    name: 'Bắc',
    characteristics: ['Standard pronunciation', 'Formal business language', 'Government terminology'],
    examples: {
      'company': 'công ty',
      'meeting': 'cuộc họp',
      'business': 'kinh doanh'
    }
  },
  southern: {
    name: 'Nam',
    characteristics: ['Softer pronunciation', 'Commercial terminology', 'Entrepreneurial language'],
    examples: {
      'company': 'công ty',
      'meeting': 'buổi họp',
      'business': 'làm ăn'
    }
  },
  central: {
    name: 'Trung',
    characteristics: ['Traditional expressions', 'Cultural formality', 'Historical terminology'],
    examples: {
      'company': 'xí nghiệp',
      'meeting': 'phiên họp',
      'business': 'thương mại'
    }
  }
}

// Cultural Context Patterns
export const CULTURAL_CONTEXTS = {
  formality_levels: {
    very_formal: {
      name: 'Rất trang trọng',
      usage: ['Government', 'Legal', 'Academic', 'Ceremonial'],
      pronouns: ['kính thưa', 'thưa', 'dạ thưa'],
      sentence_structure: 'Complex, respectful, indirect'
    },
    formal: {
      name: 'Trang trọng',
      usage: ['Business', 'Professional', 'Client communication'],
      pronouns: ['xin chào', 'kính gửi', 'trân trọng'],
      sentence_structure: 'Professional, clear, respectful'
    },
    semi_formal: {
      name: 'Bán trang trọng',
      usage: ['Team communication', 'Internal meetings', 'Familiar clients'],
      pronouns: ['chào', 'xin chào'],
      sentence_structure: 'Friendly but professional'
    },
    informal: {
      name: 'Thân mật',
      usage: ['Close colleagues', 'Internal team', 'Casual meetings'],
      pronouns: ['hi', 'chào bạn'],
      sentence_structure: 'Casual, direct, friendly'
    }
  },
  
  business_sectors: {
    technology: {
      terminology: 'Modern, English loan words acceptable',
      formality: 'Semi-formal to formal',
      communication_style: 'Direct, efficient, innovative'
    },
    finance: {
      terminology: 'Precise financial terms, conservative language',
      formality: 'Formal to very formal',
      communication_style: 'Careful, detailed, risk-aware'
    },
    manufacturing: {
      terminology: 'Technical precision, safety emphasis',
      formality: 'Formal',
      communication_style: 'Clear, procedural, safety-first'
    },
    retail: {
      terminology: 'Customer-friendly, sales-oriented',
      formality: 'Semi-formal',
      communication_style: 'Friendly, persuasive, service-oriented'
    },
    government: {
      terminology: 'Official, formal administrative language',
      formality: 'Very formal',
      communication_style: 'Respectful, procedural, hierarchical'
    },
    education: {
      terminology: 'Academic, pedagogical language',
      formality: 'Formal',
      communication_style: 'Respectful, informative, structured'
    }
  }
}

// Helper Functions
export function getTerminology(englishTerm: string, formalityLevel: 'formal' | 'informal' | 'business'): string {
  const entry = VIETNAMESE_TERMINOLOGY.find(t => 
    t.english.toLowerCase() === englishTerm.toLowerCase()
  )
  
  if (!entry) return englishTerm
  
  return entry.vietnamese[formalityLevel] || entry.vietnamese.formal
}

export function getAddressing(
  context: 'formal' | 'business' | 'casual',
  relationship: string,
  isOtherPerson = false
): string[] {
  const addressing = VIETNAMESE_ADDRESSING.find(a => 
    a.context === context && a.relationship === relationship
  )
  
  if (!addressing) return ['bạn']
  
  return isOtherPerson ? addressing.forms.other : addressing.forms.self
}

export function getDialectVariation(term: string, dialect: 'northern' | 'southern' | 'central'): string {
  const variation = DIALECT_VARIATIONS[dialect].examples[term as keyof typeof DIALECT_VARIATIONS.northern.examples]
  return variation || term
}

export function getCulturalContext(sector: string, aspect: 'terminology' | 'formality' | 'communication_style'): string {
  const context = CULTURAL_CONTEXTS.business_sectors[sector as keyof typeof CULTURAL_CONTEXTS.business_sectors]
  return context?.[aspect] || 'Standard business communication'
}