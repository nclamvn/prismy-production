export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #dbeafe, #ffffff)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #e5e7eb', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(8px)' 
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🚀 Prismy v2
          </h1>
          <a 
            href="/api/health" 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            API Status
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '64px 16px', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '24px', 
            color: '#111827',
            lineHeight: '1.1'
          }}>
            Document Translation
            <span style={{ display: 'block', color: '#2563eb', marginTop: '8px' }}>
              Simplified
            </span>
          </h2>
          
          <p style={{ 
            fontSize: '20px', 
            color: '#6b7280', 
            marginBottom: '32px', 
            lineHeight: '1.6'
          }}>
            Upload any document and get professional translations in seconds. 
            Built with modern architecture for reliability and speed.
          </p>

          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center', 
            marginBottom: '48px',
            flexWrap: 'wrap'
          }}>
            <a 
              href="/api/health" 
              style={{ 
                padding: '12px 32px', 
                backgroundColor: '#2563eb', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '500'
              }}
            >
              Check API Status
            </a>
            <a 
              href="#features" 
              style={{ 
                padding: '12px 32px', 
                backgroundColor: '#f3f4f6', 
                color: '#111827', 
                textDecoration: 'none', 
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '500'
              }}
            >
              Learn More
            </a>
          </div>

          {/* Features Grid */}
          <div id="features" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '32px', 
            marginTop: '64px' 
          }}>
            <div style={{ 
              padding: '24px', 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Fast
              </h3>
              <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                Modern architecture with Next.js 15 for lightning-fast performance
              </p>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Secure
              </h3>
              <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                Built-in RLS policies and enterprise-grade security
              </p>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Simple
              </h3>
              <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                Clean interface with drag-and-drop file upload
              </p>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginTop: '64px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 24px', 
              backgroundColor: '#dcfce7', 
              border: '1px solid #bbf7d0', 
              borderRadius: '9999px' 
            }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#22c55e', 
                borderRadius: '50%',
                opacity: '0.8'
              }}></div>
              <span style={{ color: '#166534', fontWeight: '500' }}>
                🎉 Production Ready - All Systems Operational
              </span>
            </div>
          </div>

          {/* Tech Stack */}
          <div style={{ marginTop: '64px', textAlign: 'center' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              Powered by
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '16px' 
            }}>
              {['Next.js 15', 'Supabase', 'OpenAI', 'Vercel', 'TypeScript'].map((tech) => (
                <span 
                  key={tech}
                  style={{ 
                    padding: '4px 12px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '9999px',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Infrastructure Ready Notice */}
          <div style={{ 
            marginTop: '64px', 
            padding: '24px', 
            backgroundColor: '#fef3c7', 
            border: '1px solid #fbbf24', 
            borderRadius: '12px' 
          }}>
            <h4 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#92400e', 
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              🚧 Infrastructure Complete
            </h4>
            <p style={{ 
              color: '#92400e', 
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              All backend services, database schemas, and API endpoints are implemented and ready. 
              Features will be gradually enabled as we complete testing and optimization.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}