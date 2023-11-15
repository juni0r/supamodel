declare module '@supamodel' {
  import type Post from '@/test/post'
  import type Comment from '@/test/comment'

  interface models {
    post: typeof Post
    comment: typeof Comment
  }
}
