'use client';

import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Mail, User, Phone, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createCuratorWithInvite } from '@/lib/firestore';
import styles from './CreateCuratorModal.module.css';

interface CreateCuratorModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateCuratorModal: React.FC<CreateCuratorModalProps> = ({
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        bio: '',
        mobileNumber: '',
        upiId: '',
        isPublished: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        curatorId: string;
        inviteToken: string;
        inviteUrl: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.email || !formData.displayName) {
                throw new Error('Email and Display Name are required');
            }

            const result = await createCuratorWithInvite({
                email: formData.email.toLowerCase().trim(),
                displayName: formData.displayName.trim(),
                bio: formData.bio.trim(),
                mobileNumber: formData.mobileNumber.trim(),
                upiId: formData.upiId.trim(),
                isPublished: formData.isPublished,
            });

            setResult(result);
        } catch (err) {
            console.error('Error creating curator:', err);
            setError(err instanceof Error ? err.message : 'Failed to create curator');
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = () => {
        if (result) {
            const fullUrl = `${window.location.origin}${result.inviteUrl}`;
            navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        if (result) {
            onSuccess();
        }
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <UserPlus size={28} className={styles.headerIcon} />
                    <h2>Create New Curator</h2>
                    <p>Create a curator account and generate an invite link</p>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Mail size={16} />
                                Email Address *
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="curator@example.com"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <User size={16} />
                                Display Name *
                            </label>
                            <Input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="Fashion By Maria"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <FileText size={16} />
                                Bio (optional)
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="A short bio about the curator..."
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <Phone size={16} />
                                    Mobile Number
                                </label>
                                <Input
                                    type="tel"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleInputChange}
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <CreditCard size={16} />
                                    UPI ID
                                </label>
                                <Input
                                    type="text"
                                    name="upiId"
                                    value={formData.upiId}
                                    onChange={handleInputChange}
                                    placeholder="curator@paytm"
                                />
                            </div>
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="isPublished"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="isPublished">
                                Publish closet immediately
                            </label>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <div className={styles.buttons}>
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Curator'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h3>Curator Created Successfully!</h3>
                        <p>
                            A closet has been created for <strong>{formData.displayName}</strong>.
                            Share the invite link below with the curator so they can claim their account.
                        </p>

                        <div className={styles.inviteSection}>
                            <label>Invite Link</label>
                            <div className={styles.inviteLink}>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}${result.inviteUrl}`}
                                    className={styles.inviteInput}
                                />
                                <button
                                    type="button"
                                    className={styles.copyButton}
                                    onClick={copyInviteLink}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p className={styles.inviteNote}>
                                This link expires in 90 days. The curator can use this link to sign in with Google and claim their closet.
                            </p>
                        </div>

                        <div className={styles.details}>
                            <div className={styles.detailRow}>
                                <span>Curator ID:</span>
                                <code>{result.curatorId}</code>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Status:</span>
                                <span className={styles.statusBadge}>
                                    {formData.isPublished ? '✓ Published' : 'Draft'}
                                </span>
                            </div>
                        </div>

                        <Button variant="primary" onClick={handleClose} fullWidth>
                            Done
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
