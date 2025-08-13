// components/Header/Header.tsx
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import styles from './Header.module.scss';

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>HSEFZ 校园墙</Link>
                <nav>
                    {/* 未来可以放其他导航链接 */}
                </nav>
                <div className={styles.userSection}>
                    <UserButton afterSignOutUrl="/"/>
                </div>
            </div>
        </header>
    );
}

export default Header;