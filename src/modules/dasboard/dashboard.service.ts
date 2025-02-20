import moment from "moment";
import { User } from "../user/user.models";
import Payment from "../payments/payments.models";

const userChart = async (query: Record<string, any>) => {
    const userYear = query?.JoinYear ? query?.JoinYear : moment().year();
    const startOfUserYear = moment().year(userYear).startOf('year');
    const endOfUserYear = moment().year(userYear).endOf('year');

    const monthlyUser = await User.aggregate([
        {
            $match: {
                status: 1,
                createdAt: {
                    $gte: startOfUserYear.toDate(),
                    $lte: endOfUserYear.toDate(),
                },
            },
        },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                total: { $sum: 1 }, // Corrected to count the documents
            },
        },
        {
            $sort: { '_id.month': 1 },
        },
    ]);

    // Format monthly income to have an entry for each month
    const formattedMonthlyUsers = Array.from({ length: 12 }, (_, index) => ({
        month: moment().month(index).format('MMM'),
        total: 0,
    }));

    monthlyUser.forEach(entry => {
        formattedMonthlyUsers[entry._id.month - 1].total = Math.round(entry.total);
    });
    return formattedMonthlyUsers
}

const earningChart = async (query: Record<string, any>) => {
    const year = query.incomeYear ? query.incomeYear : moment().year();
    const startOfYear = moment().year(year).startOf('year');
    const endOfYear = moment().year(year).endOf('year');

    const monthlyIncome = await Payment.aggregate([
        {
            $match: {
                isPaid: true,
                createdAt: {
                    $gte: startOfYear.toDate(),
                    $lte: endOfYear.toDate(),
                },
            },
        },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                income: { $sum: '$amount' },
            },
        },
        {
            $sort: { '_id.month': 1 },
        },
    ]);

    // Format monthly income to have an entry for each month
    const formattedMonthlyIncome = Array.from({ length: 12 }, (_, index) => ({
        month: moment().month(index).format('MMM'),
        income: 0,
    }));

    monthlyIncome.forEach(entry => {
        formattedMonthlyIncome[entry._id.month - 1].income = Math.round(
            entry.income,
        );
    });

    return formattedMonthlyIncome
}

const countData = async () => {
    const totalUsers = await User.countDocuments({ status: 1 });
    const earnings = await Payment.aggregate([
        {
            $match: {
                isPaid: true,
            },
        },
        {
            $facet: {
                totalEarnings: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' },
                        },
                    },
                ],
                allData: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'userDetails',
                        },
                    },
                    {
                        $lookup: {
                            from: 'subscription',
                            localField: 'subscription',
                            foreignField: '_id',
                            as: 'subscription',
                        },
                    },
                    {
                        $project: {
                            user: { $arrayElemAt: ['$userDetails', 0] },
                            subscription: { $arrayElemAt: ['$subscription', 0] },
                            amount: 1,
                            tranId: 1,
                            status: 1,
                            id: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                    {
                        $limit: 10,
                    },
                ],
            },
        },
    ]);

    const totalEarnings =
        (earnings?.length > 0 &&
            earnings[0]?.totalEarnings?.length > 0 &&
            earnings[0]?.totalEarnings[0]?.total) ||
        0;

    return { totalEarnings, totalUsers }
}

export const dashboardService = {
    userChart,
    earningChart,
    countData
}