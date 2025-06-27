import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft, 
  Share2,
  BookOpen,
  Tag
} from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  image: string
  tags: string[]
  category: string
}

// Mock blog posts data - replace with actual data fetching
const blogPosts: Record<string, BlogPost> = {
  '1': {
    id: '1',
    title: 'The Future of AI Translation: Breaking Language Barriers',
    excerpt: 'Explore how artificial intelligence is revolutionizing the translation industry and making cross-cultural communication more accessible than ever.',
    content: `
      <h2>The Evolution of Translation Technology</h2>
      <p>Translation has come a long way from simple dictionary lookups to sophisticated AI-powered systems that understand context, nuance, and cultural implications.</p>
      
      <h3>Key Advantages of AI Translation</h3>
      <ul>
        <li><strong>Speed:</strong> Translate documents in seconds rather than hours</li>
        <li><strong>Consistency:</strong> Maintain terminology across large projects</li>
        <li><strong>Cost-effectiveness:</strong> Reduce translation costs by up to 80%</li>
        <li><strong>Accessibility:</strong> Make content available in multiple languages instantly</li>
      </ul>
      
      <h3>Industry Applications</h3>
      <p>AI translation is transforming industries from e-commerce to healthcare, enabling global communication and breaking down language barriers.</p>
      
      <h2>The Prismy Advantage</h2>
      <p>At Prismy, we combine cutting-edge AI with human expertise to deliver translations that are not just accurate, but culturally relevant and contextually appropriate.</p>
    `,
    author: 'Prismy Team',
    date: '2024-06-27',
    readTime: '5 min read',
    image: '/assets/features.gif',
    tags: ['AI', 'Translation', 'Technology'],
    category: 'Technology'
  },
  '2': {
    id: '2',
    title: 'Best Practices for Document Translation',
    excerpt: 'Learn essential tips and strategies for preparing documents for translation to ensure the best possible results.',
    content: `
      <h2>Preparing Your Documents</h2>
      <p>Proper document preparation is crucial for achieving high-quality translations. Here are the essential steps:</p>
      
      <h3>Document Formatting</h3>
      <ul>
        <li>Use clear, consistent formatting throughout your document</li>
        <li>Avoid complex layouts that may affect translation accuracy</li>
        <li>Ensure text is selectable and not embedded in images</li>
      </ul>
      
      <h3>Content Guidelines</h3>
      <p>Write with translation in mind by using clear, concise language and avoiding idioms or cultural references that may not translate well.</p>
    `,
    author: 'Translation Expert',
    date: '2024-06-25',
    readTime: '7 min read',
    image: '/assets/features.gif',
    tags: ['Best Practices', 'Documents', 'Tips'],
    category: 'Guide'
  }
}

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = blogPosts[params.id]
  
  if (!post) {
    return {
      title: 'Post Not Found - Prismy Blog'
    }
  }

  return {
    title: `${post.title} - Prismy Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image]
    }
  }
}

export default function BlogPostPage({ params }: PageProps) {
  const post = blogPosts[params.id]

  if (!post) {
    notFound()
  }

  const relatedPosts = Object.values(blogPosts)
    .filter(p => p.id !== post.id)
    .slice(0, 2)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          {/* Category */}
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium px-3 py-1 rounded-full" 
                  style={{ backgroundColor: 'var(--notebooklm-primary-light)', color: 'var(--notebooklm-primary)' }}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="heading-1 mb-6 leading-tight">{post.title}</h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Share Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium">Share:</span>
            <button className="btn-md3-text-sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Article
            </button>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative w-full h-64 md:h-96 mb-12 rounded-2xl overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none"
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">{post.author}</p>
                <p className="text-sm text-gray-600">Translation Expert</p>
              </div>
            </div>
            <button className="btn-md3-outlined-sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-16" style={{ backgroundColor: 'var(--surface-panel)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
              <BookOpen className="w-5 h-5" style={{ color: 'var(--notebooklm-primary)' }} />
              <h2 className="heading-2">Related Articles</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  href={`/blog/${relatedPost.id}`}
                  className="card-base p-6 hover:shadow-lg transition-all group"
                >
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={relatedPost.image}
                      alt={relatedPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded" 
                          style={{ backgroundColor: 'var(--notebooklm-primary-light)', color: 'var(--notebooklm-primary)' }}>
                      {relatedPost.category}
                    </span>
                  </div>
                  <h3 className="heading-4 mb-3 group-hover:text-blue-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="body-sm text-gray-600 mb-4 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(relatedPost.date).toLocaleDateString()}</span>
                    <span>{relatedPost.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// Generate static params for static generation
export function generateStaticParams() {
  return Object.keys(blogPosts).map((id) => ({
    id,
  }))
}