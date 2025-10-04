// lib/store.ts
import { create } from 'zustand';
import { PostWithDetails } from '@/components/PostCard/PostCard';
import { toggleLikeAction } from './social-actions';
import { notifications } from '@mantine/notifications';

interface PostStore {
    posts: PostWithDetails[];
    setPosts: (posts: PostWithDetails[]) => void;
    toggleLike: (postId: number) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
    posts: [],
    setPosts: (posts) => set({ posts }),

    toggleLike: (postId: number) => {
        const originalPosts = get().posts;

        // 1. 乐观更新 UI
        set(state => ({
            posts: state.posts.map(p => {
                if (p.id === postId) {
                    const newLikedState = !p.has_liked;
                    const newLikeCount = newLikedState ? p.like_count + 1 : p.like_count - 1;
                    return { ...p, has_liked: newLikedState, like_count: newLikeCount };
                }
                return p;
            })
        }));

        // 2. 在后台调用 Server Action
        toggleLikeAction(postId).catch(() => {
            notifications.show({ color: 'red', message: '操作失败，请重试' });
            // 3. 如果失败，回滚到原始状态
            set({ posts: originalPosts });
        });
    },
}));