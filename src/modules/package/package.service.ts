import AppError from "../../error/AppError";
import { IPackage } from "./package.interface"
import Package from "./package.model";
import httpStatus from 'http-status';

//create a new package
const create_Package = async (payload: IPackage) => {
    const packages = await Package.create(payload);
    if (!packages) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to create packages',
        );
    }
    return packages;
}

const update_Package = async (payload: IPackage, id: string) => {
    const packages = await Package.updateOne({ _id: id }, {...payload});
    return packages;
}

// get all packeges and filter by plan type
const getPackages_by_type = async (packageType?: 'standard' | "premium") => {
    const query = packageType ? { plan_type: packageType, isDeleted: false } : { isDeleted: false };
    const packages = await Package.find(query);
    return packages;
}

export const packageService = {
    create_Package,
    getPackages_by_type,
    update_Package
}