export const calculateRentalTotal = (
    days: number,
    pricePerDay: number,
    deposit: number,
    platformFee: number = 50
) => {
    if (days <= 0) return 0;
    const rentalFee = days * pricePerDay;
    return rentalFee + deposit + platformFee;
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};
