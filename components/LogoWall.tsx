'use client'

interface LogoWallProps {
  language?: 'vi' | 'en'
}

export default function LogoWall({ language = 'en' }: LogoWallProps) {
  const content = {
    vi: {
      title: 'Được tin tưởng bởi các tổ chức hàng đầu',
      subtitle: 'Hàng nghìn doanh nghiệp đã chọn Prismy cho nhu cầu dịch thuật của họ'
    },
    en: {
      title: 'Trusted by leading organizations',
      subtitle: 'Thousands of businesses have chosen Prismy for their translation needs'
    }
  }

  // Simulated company logos (in production, these would be actual client logos)
  const logos = [
    { name: 'TechCorp', width: 120 },
    { name: 'GlobalInc', width: 100 },
    { name: 'InnovateSpace', width: 140 },
    { name: 'FutureWorks', width: 110 },
    { name: 'WorldBridge', width: 130 },
    { name: 'NextGen', width: 95 },
    { name: 'SmartSolutions', width: 135 },
    { name: 'ConnectGlobal', width: 115 }
  ]

  return (
    <section className="w-full py-16 bg-main border-t border-gray-100">
      <div className="content-container">
        <div className="text-center animate-fade-in">
          <h3 className="heading-4 text-black mb-2 animate-slide-up">
            {content[language].title}
          </h3>
          <p className="body-sm text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {content[language].subtitle}
          </p>

          {/* Logo Grid with Grayscale Effect */}
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 max-w-4xl mx-auto">
            {logos.map((logo, index) => (
              <div
                key={logo.name}
                className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300 cursor-pointer animate-scale-in"
                style={{ 
                  width: logo.width, 
                  height: 60,
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Placeholder logo - in production, replace with actual SVG logos */}
                <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {logo.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Enterprise-grade security</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>99.9% uptime SLA</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}