# 🔧 Troubleshooting Guide - Prismy

Common issues and their solutions for Prismy development.

## 🚨 Build Issues

### TypeScript Errors

**Problem**: Build fails with TypeScript errors
```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solutions**:
1. **Check type definitions**:
   ```bash
   npm run type-check
   ```

2. **Common fixes**:
   ```typescript
   // ✅ Fix: Proper type assertion
   const id = parseInt(params.id, 10)
   
   // ✅ Fix: Type guards
   if (typeof value === 'string') {
     // Safe to use as string
   }
   
   // ✅ Fix: Optional chaining
   const name = user?.profile?.name ?? 'Unknown'
   ```

3. **Update type definitions**:
   ```bash
   npm install --save-dev @types/node@latest
   ```

### Import/Export Errors

**Problem**: Module not found errors
```
Module not found: Can't resolve '@/components/Button'
```

**Solutions**:
1. **Check file existence**:
   ```bash
   ls -la components/ui/Button.tsx
   ```

2. **Verify import paths**:
   ```typescript
   // ✅ Correct path mapping
   import { Button } from '@/components/ui/Button'
   
   // ❌ Wrong path
   import { Button } from 'components/ui/Button'
   ```

3. **Check tsconfig.json paths**:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

### Next.js Build Failures

**Problem**: Next.js compilation errors
```
Error: Failed to compile
```

**Solutions**:
1. **Clear cache**:
   ```bash
   npm run clean
   rm -rf .next
   npm run build
   ```

2. **Check Next.js configuration**:
   ```javascript
   // next.config.js
   module.exports = {
     eslint: {
       ignoreDuringBuilds: true // Temporary fix
     },
     typescript: {
       ignoreBuildErrors: true // Temporary fix
     }
   }
   ```

3. **Update dependencies**:
   ```bash
   npm update next react react-dom
   ```

---

## 🔌 Database Issues

### Supabase Connection Problems

**Problem**: Database connection fails
```
Error: Invalid API key or unable to connect to Supabase
```

**Solutions**:
1. **Verify environment variables**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Check Supabase dashboard**:
   - Verify project is active
   - Check API keys are correct
   - Ensure RLS policies allow access

3. **Test connection**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   
   // Test query
   const { data, error } = await supabase
     .from('health_check')
     .select('*')
     .limit(1)
   
   console.log({ data, error })
   ```

### Migration Issues

**Problem**: Database migrations fail
```
Error: relation "users" does not exist
```

**Solutions**:
1. **Check migration order**:
   ```bash
   ls -la config/database/supabase/migrations/
   ```

2. **Run migrations manually**:
   ```bash
   supabase migration up
   ```

3. **Reset database** (development only):
   ```bash
   supabase db reset
   ```

### RLS Policy Errors

**Problem**: Row Level Security blocking queries
```
Error: new row violates row-level security policy
```

**Solutions**:
1. **Check user authentication**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   ```

2. **Review RLS policies**:
   ```sql
   -- Check existing policies
   SELECT * FROM pg_policies WHERE tablename = 'documents';
   
   -- Temporarily disable RLS (development only)
   ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
   ```

3. **Fix policy conditions**:
   ```sql
   -- Correct policy
   CREATE POLICY "Users can view own documents" ON documents
     FOR SELECT USING (auth.uid() = user_id);
   ```

---

## 🔐 Authentication Issues

### Auth State Problems

**Problem**: User state not persisting
```
User appears logged in but loses session on refresh
```

**Solutions**:
1. **Check auth configuration**:
   ```typescript
   // _app.tsx or layout.tsx
   export default function App({ children }) {
     return (
       <AuthProvider>
         {children}
       </AuthProvider>
     )
   }
   ```

2. **Verify session handling**:
   ```typescript
   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session)
     })

     const {
       data: { subscription },
     } = supabase.auth.onAuthStateChange((_event, session) => {
       setSession(session)
     })

     return () => subscription.unsubscribe()
   }, [])
   ```

3. **Check cookies/localStorage**:
   ```javascript
   // Clear auth data
   localStorage.removeItem('supabase.auth.token')
   // Or check browser dev tools > Application > Storage
   ```

### Login/Signup Failures

**Problem**: Authentication requests fail
```
Error: Invalid login credentials
```

**Solutions**:
1. **Verify email confirmation**:
   - Check if email confirmation is required
   - Look for confirmation email in spam folder

2. **Check Supabase Auth settings**:
   - Verify redirect URLs
   - Check if signups are enabled
   - Review email templates

3. **Debug auth flow**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password'
   })
   
   console.log('Auth result:', { data, error })
   ```

---

## 🤖 AI Service Issues

### OpenAI API Problems

**Problem**: OpenAI API requests fail
```
Error: Incorrect API key provided
```

**Solutions**:
1. **Verify API key**:
   ```bash
   echo $OPENAI_API_KEY
   # Should start with sk-
   ```

2. **Check API usage limits**:
   - Visit OpenAI dashboard
   - Check rate limits and quotas
   - Verify billing status

3. **Test API connection**:
   ```typescript
   import OpenAI from 'openai'
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY
   })
   
   try {
     const response = await openai.chat.completions.create({
       model: 'gpt-3.5-turbo',
       messages: [{ role: 'user', content: 'Hello' }],
       max_tokens: 50
     })
     console.log('API working:', response.choices[0].message.content)
   } catch (error) {
     console.error('API error:', error)
   }
   ```

### Translation Service Issues

**Problem**: Translation requests timing out
```
Error: Request timeout after 30000ms
```

**Solutions**:
1. **Implement retry logic**:
   ```typescript
   async function translateWithRetry(text: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await translateText(text)
       } catch (error) {
         if (i === retries - 1) throw error
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
       }
     }
   }
   ```

2. **Check text length limits**:
   ```typescript
   const MAX_TEXT_LENGTH = 5000
   
   if (text.length > MAX_TEXT_LENGTH) {
     // Split text into chunks
     const chunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH)
     const translations = await Promise.all(
       chunks.map(chunk => translateText(chunk))
     )
     return translations.join(' ')
   }
   ```

3. **Monitor API quotas**:
   - Check Google Translate API console
   - Verify billing is enabled
   - Review usage patterns

---

## 💳 Payment Issues

### Stripe Integration Problems

**Problem**: Payment processing fails
```
Error: No such payment_intent: pi_xxxxx
```

**Solutions**:
1. **Verify Stripe keys**:
   ```bash
   echo $STRIPE_PUBLISHABLE_KEY # Should start with pk_
   echo $STRIPE_SECRET_KEY      # Should start with sk_
   ```

2. **Check webhook endpoints**:
   ```bash
   # Test webhook endpoint
   curl -X POST http://localhost:3000/api/stripe/webhooks \
     -H "Content-Type: application/json" \
     -d '{"type": "payment_intent.succeeded"}'
   ```

3. **Debug webhook signatures**:
   ```typescript
   const sig = headers.get('stripe-signature')
   
   try {
     const event = stripe.webhooks.constructEvent(
       body,
       sig!,
       process.env.STRIPE_WEBHOOK_SECRET!
     )
     console.log('Webhook verified:', event.type)
   } catch (err) {
     console.error('Webhook signature verification failed:', err)
     return new Response('Invalid signature', { status: 400 })
   }
   ```

### Subscription Issues

**Problem**: Subscription status not updating
```
User shows as subscribed but features are locked
```

**Solutions**:
1. **Check database sync**:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'user-id';
   ```

2. **Verify webhook processing**:
   ```typescript
   // Check webhook logs
   console.log('Processing webhook:', {
     type: event.type,
     customerId: event.data.object.customer,
     subscriptionId: event.data.object.id
   })
   ```

3. **Manual subscription sync**:
   ```typescript
   // Force refresh from Stripe
   const subscription = await stripe.subscriptions.retrieve(subscriptionId)
   await updateUserSubscription(userId, subscription)
   ```

---

## 🎨 Styling Issues

### Tailwind CSS Problems

**Problem**: Tailwind classes not applying
```
Classes appear in HTML but no styles are applied
```

**Solutions**:
1. **Check PostCSS configuration**:
   ```javascript
   // postcss.config.js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

2. **Verify Tailwind config**:
   ```javascript
   // tailwind.config.ts
   module.exports = {
     content: [
       './pages/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
       './app/**/*.{js,ts,jsx,tsx}',
     ],
     // ...
   }
   ```

3. **Clear and rebuild**:
   ```bash
   rm -rf .next
   npm run dev
   ```

### CSS Import Issues

**Problem**: Global styles not loading
```
Custom CSS classes are not defined
```

**Solutions**:
1. **Check CSS imports**:
   ```typescript
   // app/layout.tsx
   import '@/styles/globals.css'
   import '@/styles/components.css'
   ```

2. **Verify CSS file paths**:
   ```bash
   ls -la styles/
   ```

3. **Check CSS syntax**:
   ```css
   /* Make sure CSS is valid */
   .my-custom-class {
     color: red; /* Don't forget semicolons */
   }
   ```

---

## 📱 Performance Issues

### Slow Page Loads

**Problem**: Pages loading slowly
```
Lighthouse score shows poor performance
```

**Solutions**:
1. **Analyze bundle size**:
   ```bash
   npm run analyze
   ```

2. **Implement code splitting**:
   ```typescript
   import { lazy, Suspense } from 'react'
   
   const HeavyComponent = lazy(() => import('./HeavyComponent'))
   
   function App() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <HeavyComponent />
       </Suspense>
     )
   }
   ```

3. **Optimize images**:
   ```typescript
   import Image from 'next/image'
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority // For above-the-fold images
   />
   ```

### Memory Leaks

**Problem**: Memory usage keeps increasing
```
Application becomes slow over time
```

**Solutions**:
1. **Check for cleanup**:
   ```typescript
   useEffect(() => {
     const subscription = someService.subscribe()
     
     // Always cleanup
     return () => {
       subscription.unsubscribe()
     }
   }, [])
   ```

2. **Monitor event listeners**:
   ```typescript
   useEffect(() => {
     const handleResize = () => setWidth(window.innerWidth)
     
     window.addEventListener('resize', handleResize)
     return () => window.removeEventListener('resize', handleResize)
   }, [])
   ```

3. **Use React DevTools Profiler**:
   - Install React DevTools
   - Record performance
   - Look for unnecessary re-renders

---

## 🔧 Development Tools

### VS Code Issues

**Problem**: IntelliSense not working
```
No autocompletion or type checking in editor
```

**Solutions**:
1. **Restart TypeScript server**:
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

2. **Check workspace settings**:
   ```json
   // .vscode/settings.json
   {
     "typescript.preferences.includePackageJsonAutoImports": "on",
     "typescript.suggest.autoImports": true
   }
   ```

3. **Install recommended extensions**:
   - TypeScript and JavaScript Language Features
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense

### Git Issues

**Problem**: Merge conflicts in package-lock.json
```
Conflicts in package-lock.json are complex to resolve
```

**Solutions**:
1. **Delete and regenerate**:
   ```bash
   git checkout HEAD -- package-lock.json
   rm package-lock.json
   npm install
   git add package-lock.json
   ```

2. **Use npm ci for clean installs**:
   ```bash
   rm -rf node_modules package-lock.json
   npm ci
   ```

---

## 🆘 Getting Help

### Debug Checklist
- [ ] Check browser console for errors
- [ ] Verify environment variables
- [ ] Clear cache and rebuild
- [ ] Check service status (Supabase, Vercel, etc.)
- [ ] Review recent changes in git
- [ ] Test in different browsers/devices
- [ ] Check network connectivity

### When to Ask for Help
1. **Tried solutions above** - Don't skip troubleshooting steps
2. **Documented the issue** - Include error messages, steps to reproduce
3. **Isolated the problem** - Narrow down to specific component/function
4. **Checked recent changes** - Review what changed before issue occurred

### How to Ask for Help
1. **Slack #prismy-dev** - For quick questions
2. **GitHub Issues** - For bugs and feature requests  
3. **Code Review** - Tag team members in PR
4. **Pair Programming** - Schedule session for complex issues

### Information to Include
- Error messages (full stack trace)
- Steps to reproduce
- Expected vs actual behavior
- Environment (dev/staging/production)
- Browser/device information
- Recent changes made

---

*Keep this guide updated with new issues and solutions!*