# ==========================================
# PRISMY ZERO-CHAOS LOCAL DEVELOPMENT
# ==========================================
# One-liner commands for local stack management
# Usage: make up, make down, make reset-db

.PHONY: help up down reset-db clean logs test test-unit test-e2e build dev

# Default target
help: ## Show this help message
	@echo "Prismy Zero-Chaos Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==========================================
# LOCAL STACK MANAGEMENT
# ==========================================

up: ## Start full local stack (web + supabase + edge services)
	@echo "🚀 Starting Prismy local stack..."
	@docker-compose up -d
	@echo "✅ Stack ready! Web: http://localhost:3000"
	@echo "📊 Supabase Studio: http://localhost:54323"
	@echo "📨 Inbucket (email): http://localhost:54324"

down: ## Stop all services
	@echo "🛑 Stopping Prismy stack..."
	@docker-compose down
	@echo "✅ All services stopped"

reset-db: ## Reset and seed database
	@echo "🗄️  Resetting database..."
	@docker-compose exec supabase supabase db reset --linked
	@echo "🌱 Seeding database..."
	@docker-compose exec supabase supabase db seed
	@echo "✅ Database reset complete"

clean: ## Clean all containers, volumes, and build artifacts
	@echo "🧹 Cleaning up..."
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@rm -rf .next node_modules/.cache
	@echo "✅ Cleanup complete"

logs: ## Show live logs from all services
	@docker-compose logs -f

# ==========================================
# DEVELOPMENT COMMANDS
# ==========================================

dev: ## Start development server (outside docker for fast HMR)
	@echo "🔥 Starting Next.js dev server..."
	@npm run dev

build: ## Build for production
	@echo "🏗️  Building for production..."
	@npm run build

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@npm ci

# ==========================================
# TESTING COMMANDS  
# ==========================================

test: ## Run all tests (unit + e2e)
	@echo "🧪 Running all tests..."
	@npm run test:all

test-unit: ## Run unit tests with coverage
	@echo "🔬 Running unit tests..."
	@npm run test:coverage

test-e2e: ## Run e2e tests against local stack
	@echo "🎭 Running e2e tests..."
	@npm run test:e2e

test-mutation: ## Run mutation testing
	@echo "🧬 Running mutation tests..."
	@npm run test:mutation

# ==========================================
# QUALITY GATES
# ==========================================

lint: ## Run linting
	@echo "🔍 Running linter..."
	@npm run lint

type-check: ## Run TypeScript type checking
	@echo "📝 Running type check..."
	@npm run type-check

quality: ## Run full quality check suite
	@echo "✨ Running quality checks..."
	@npm run quality:full

# ==========================================
# DOCKER DEVELOPMENT
# ==========================================

docker-dev: ## Start development in Docker with volume mounting
	@echo "🐳 Starting Docker development environment..."
	@docker-compose -f docker-compose.dev.yml up

docker-build: ## Build Docker image locally
	@echo "🐳 Building Docker image..."
	@docker build -t prismy:local .

# ==========================================
# DATABASE COMMANDS
# ==========================================

db-migrate: ## Run database migrations
	@echo "📊 Running migrations..."
	@docker-compose exec supabase supabase db push

db-seed: ## Seed database with test data
	@echo "🌱 Seeding database..."
	@docker-compose exec supabase supabase db seed

db-studio: ## Open Supabase Studio
	@echo "📊 Opening Supabase Studio..."
	@open http://localhost:54323

# ==========================================
# OAUTH ENDOSCOPE METHOD COMMANDS
# ==========================================

doctor: ## Run OAuth health check (Endoscope Method)
	@echo "🩺 Running OAuth health diagnostics..."
	@npm run doctor

test-oauth: ## Run 5-minute OAuth test suite
	@echo "🧪 Running OAuth test suite..."
	@npm run test:oauth

test-oauth-prod: ## Test OAuth against production
	@echo "🧪 Testing OAuth against production..."
	@npm run test:oauth:prod

up-auth: ## Start local Supabase auth stack for OAuth testing
	@echo "🔧 Starting local Supabase auth environment..."
	@if [ ! -f .env.local ]; then \
		echo "⚠️  .env.local not found. Creating template..."; \
		cp .env.local.example .env.local; \
		echo "📝 Please update .env.local with your OAuth credentials"; \
	fi
	@docker-compose -f docker-compose.auth.yml up -d
	@echo "✅ Local auth services started:"
	@echo "   🔐 Auth: http://localhost:9999"
	@echo "   🎛️  Studio: http://localhost:3001"

down-auth: ## Stop local Supabase auth stack
	@echo "🛑 Stopping local auth services..."
	@docker-compose -f docker-compose.auth.yml down

setup-https: ## Setup local HTTPS certificates for auth testing
	@echo "🔐 Setting up local HTTPS certificates..."
	@mkdir -p docker/ssl
	@if command -v mkcert >/dev/null 2>&1; then \
		mkcert -install; \
		mkcert -key-file docker/ssl/key.pem -cert-file docker/ssl/cert.pem localhost auth.prismy.localhost prismy.localhost; \
		echo "✅ HTTPS certificates created"; \
		echo "📝 Add to your /etc/hosts:"; \
		echo "127.0.0.1 auth.prismy.localhost"; \
		echo "127.0.0.1 prismy.localhost"; \
	else \
		echo "❌ mkcert not installed. Install: brew install mkcert"; \
		exit 1; \
	fi

# ==========================================
# UTILITY COMMANDS
# ==========================================

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps
	@if docker-compose -f docker-compose.auth.yml ps | grep -q "Up"; then \
		echo "🟢 Auth services: Running"; \
		docker-compose -f docker-compose.auth.yml ps; \
	else \
		echo "🔴 Auth services: Stopped"; \
	fi

env-check: ## Validate environment variables
	@echo "🔧 Checking environment..."
	@node -e "console.log('NODE_ENV:', process.env.NODE_ENV || 'development')"
	@node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')"
	@node -e "console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')"

quick-start: ## Quick start for new developers
	@echo "🚀 Quick Start Setup:"
	@echo "1. Installing dependencies..."
	@npm ci
	@echo "2. Starting local stack..."
	@make up
	@echo "3. Waiting for services..."
	@sleep 10
	@echo "4. Running initial tests..."
	@npm run test:unit
	@echo ""
	@echo "✅ Setup complete! Visit http://localhost:3000"
	@echo "📖 Run 'make help' for more commands"

# ==========================================
# CI/CD SIMULATION
# ==========================================

ci-local: ## Simulate CI pipeline locally
	@echo "🤖 Simulating CI pipeline..."
	@make lint
	@make type-check  
	@make test-unit
	@make build
	@echo "✅ Local CI simulation complete"

# ==========================================
# EMERGENCY COMMANDS
# ==========================================

emergency-reset: ## Nuclear option - reset everything
	@echo "☢️  EMERGENCY RESET - This will destroy all local data!"
	@read -p "Are you sure? (y/N): " -n 1 -r; echo; if [[ $$REPLY =~ ^[Yy]$$ ]]; then make clean && make up && make reset-db; fi