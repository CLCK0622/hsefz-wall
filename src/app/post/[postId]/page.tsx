// app/post/[postId]/page.tsx
import HomePage from "@/app/page"; // 1. 直接导入主页组件
import { PostModal } from "@/components/PostModal/PostModal"; // 2. 导入我们即将创建的模态框组件

export default function PostPageWithModal({ params }: { params: { postId: string } }) {
    return (
        <>
            {/* 3. 在后台渲染主页 */}
            <HomePage />

            {/* 4. 在主页之上渲染模态框 */}
            <PostModal postId={params.postId} />
        </>
    );
}