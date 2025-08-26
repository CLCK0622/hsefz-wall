// app/user/[[...user-profile]]/page.tsx

import { UserProfile } from "@clerk/nextjs";
import { Flex } from "@mantine/core";
import Header from "@/components/Header/Header";

const UserProfilePage = () => (
    <>
        <Flex
            justify="center"
            align="center"
            direction="column"
            py="xl"
        >
            <UserProfile path="/user" />
        </Flex>
    </>
);

export default UserProfilePage;