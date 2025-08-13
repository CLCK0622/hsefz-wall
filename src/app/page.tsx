// app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Header from "@/components/Header/Header";
import styles from './page.module.scss';

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    // 理论上中间件会处理，但作为双重保险
    // redirect('/sign-in');
    return null;
  }

  // 从数据库获取帖子
  // 使用 ORDER BY is_announcement DESC 可以让公告排在最前面
  // 然后再按创建时间倒序排列
  const posts = await db
      .selectFrom('posts')
      .selectAll()
      .orderBy('is_announcement', 'desc')
      .orderBy('created_at', 'desc')
      .limit(50) // 先简单做个分页
      .execute();

  return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.feed}>
            {/* TODO: 帖子发布组件 */}

            <div className={styles.postList}>
              {posts.length > 0 ? (
                  posts.map((post) => (
                      <div key={post.id} className={styles.postCard}>
                        {post.is_announcement && <span className={styles.announcementTag}>公告</span>}
                        <p>{post.content}</p>
                        <small>发布于: {new Date(post.created_at).toLocaleString()}</small>
                      </div>
                  ))
              ) : (
                  <p>还没有人发布内容，快来抢占第一个吧！</p>
              )}
            </div>
          </div>
        </main>
      </>
  );
}