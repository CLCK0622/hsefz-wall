// app/post/[postId]/page.tsx
import HomePage from "@/app/page";
import { PostModal } from "@/components/PostModal/PostModal";

// Update the function signature to type both params and searchParams as 'any'
export default function PostPageWithModal({
                                              params,
                                              searchParams
                                          }: {
    params: any;
    searchParams: any; // <-- The fix is here
}) {
    return (
        <>
            <HomePage searchParams={searchParams} />
            <PostModal postId={params.postId} />
        </>
    );
}