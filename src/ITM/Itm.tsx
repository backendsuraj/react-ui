import React from 'react';
import styles from "./Itm.module.css";

const ITM: React.FC = () => {
    document.title = "ITM - Connect Now";
    return (
        <div className={styles.itmWrapper}>
            <div className={styles.itmBox}>
                <h1 className={styles.itmHeader}>Interactive Teller Machine</h1>
                <p className={styles.itmSubtitle}>Connect with a teller to assist you</p>
                <button className={styles.itmConnectBtn}>Connect Now</button>
            </div>
        </div>
    );
};

export default ITM;
