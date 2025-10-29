import styles from './GlowBackground.module.scss';

const GlowBackground = () => {
    return (
        <div className={styles.glowContainer}>
            <div className={`${styles.glowSpot} ${styles.spot1}`}></div>
            <div className={`${styles.glowSpot} ${styles.spot2}`}></div>
            <div className={`${styles.glowSpot} ${styles.spot3}`}></div>
            <div className={`${styles.glowSpot} ${styles.spot4}`}></div>
            <div className={`${styles.glowSpot} ${styles.spot5}`}></div>
            {/* 你可以根据需要添加更多光斑 */}
            {/* <div className={`${styles.glowSpot} ${styles.spot3}`}></div> */}
        </div>
    );
};

export default GlowBackground;