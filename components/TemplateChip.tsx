'use client'

interface TemplateChipProps {
  label: string
  description: string
  isActive?: boolean
  onClick?: () => void
}

export default function TemplateChip({ 
  label, 
  description, 
  isActive = false, 
  onClick 
}: TemplateChipProps) {
  return (
    <button
      className={`template-chip animate-scale-in hover:scale-105 active:scale-95 transition-transform duration-200 ${isActive ? 'template-chip-active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
      title={description}
    >
      <div className="text-left">
        <div className="font-medium">{label}</div>
        <div className="text-xs opacity-75 mt-1">{description}</div>
      </div>
    </button>
  )
}

// Template chips section component
interface TemplateChipsProps {
  language?: 'vi' | 'en'
}

export function TemplateChips({ language = 'en' }: TemplateChipsProps) {
  const content = {
    vi: {
      title: 'Chọn loại dịch thuật của bạn',
      subtitle: 'Mô hình AI được tối ưu hóa cho các loại nội dung khác nhau',
      templates: [
        { id: 'business', label: 'Kinh doanh', description: 'Hợp đồng, email, báo cáo' },
        { id: 'academic', label: 'Học thuật', description: 'Bài nghiên cứu, luận văn' },
        { id: 'legal', label: 'Pháp lý', description: 'Tài liệu, thỏa thuận' },
        { id: 'medical', label: 'Y tế', description: 'Báo cáo lâm sàng, nghiên cứu' },
        { id: 'creative', label: 'Sáng tạo', description: 'Văn học, nội dung marketing' },
        { id: 'technical', label: 'Kỹ thuật', description: 'Hướng dẫn, thông số kỹ thuật' }
      ]
    },
    en: {
      title: 'Choose Your Translation Type',
      subtitle: 'Optimized AI models for different content types',
      templates: [
        { id: 'business', label: 'Business', description: 'Contracts, emails, reports' },
        { id: 'academic', label: 'Academic', description: 'Research papers, theses' },
        { id: 'legal', label: 'Legal', description: 'Documents, agreements' },
        { id: 'medical', label: 'Medical', description: 'Clinical reports, studies' },
        { id: 'creative', label: 'Creative', description: 'Literature, marketing copy' },
        { id: 'technical', label: 'Technical', description: 'Manuals, specifications' }
      ]
    }
  }

  return (
    <section className="w-full py-16 bg-main">
      <div className="content-container">
        <div className="text-center mb-12">
          <h2 className="heading-3 text-black mb-4">
            {content[language].title}
          </h2>
          <p className="body-base text-gray-600">
            {content[language].subtitle}
          </p>
        </div>

        {/* Horizontal carousel for all screen sizes */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max px-4 animate-fade-in">
            {content[language].templates.map((template) => (
              <div key={template.id} className="flex-shrink-0">
                <TemplateChip
                  label={template.label}
                  description={template.description}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}