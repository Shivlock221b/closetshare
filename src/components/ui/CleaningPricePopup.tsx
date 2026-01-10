'use client';

import React from 'react';
import { X, Droplets, Wind } from 'lucide-react';
import styles from './CleaningPricePopup.module.css';

interface CleaningPricePopupProps {
    onClose: () => void;
}

export const CleaningPricePopup: React.FC<CleaningPricePopupProps> = ({ onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <h2>Cleaning & Washing Price List</h2>
                    <p>Standard rates for garment care services</p>
                </div>

                <div className={styles.content}>
                    {/* Washing Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Droplets size={20} className={styles.sectionIcon} />
                            <h3>Washing & Steam Ironing</h3>
                        </div>
                        <table className={styles.priceTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Simple Wash</td>
                                    <td className={styles.price}>₹100/kg</td>
                                </tr>
                                <tr>
                                    <td>Woolen Wash</td>
                                    <td className={styles.price}>₹150/kg</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Dry Cleaning Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Wind size={20} className={styles.sectionIcon} />
                            <h3>Dry Cleaning</h3>
                        </div>
                        <table className={styles.priceTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Simple Dry Cleaning</td>
                                    <td className={styles.price}>₹150/kg</td>
                                </tr>
                                <tr>
                                    <td>Leather Dry Cleaning</td>
                                    <td className={styles.price}>₹400/piece</td>
                                </tr>
                                <tr>
                                    <td>Shoe Dry Cleaning</td>
                                    <td className={styles.price}>₹350/pair</td>
                                </tr>
                                <tr>
                                    <td>Ethnic/Wedding Dry Cleaning</td>
                                    <td className={styles.price}>₹500/piece</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Disclaimer */}
                    <div className={styles.disclaimer}>
                        <div className={styles.disclaimerIcon}>ℹ️</div>
                        <p>
                            <strong>Note:</strong> The cost of washing/dry cleaning will be deducted from the
                            nightly rental earnings. This ensures the outfit is professionally cleaned and
                            maintained in excellent condition upon return to you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
