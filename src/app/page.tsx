// app/page.tsx
import { auth } from '@clerk/nextjs/server';
import { getCurrentUserDbInfo, getPosts } from '@/lib/actions'; // 导入 getPosts
import HomePageClient from './HomepageClient';

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
    // 从 URL search params 中获取搜索词
    const searchQuery = searchParams.q;

    // 调用统一的 action 获取帖子 (无论是搜索还是全部)
    const posts = await getPosts(searchQuery);

    // 获取当前用户信息
    const currentUser = await getCurrentUserDbInfo();

    return (
        <HomePageClient
            initialPosts={posts}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            searchQuery={searchQuery} // 将搜索词也传递给客户端
        />
    );
}