import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../error/AppError";
import { IUser } from "./user.interface";
import { User } from "./user.models";
import httpStatus from 'http-status'
import bcrypt from 'bcrypt'
import Access_comments from "../access_comments/access_comments.model";

const updateProfile = async (payload: IUser, userId: string, image: string) => {
    const { contact, name, job_role, school } = payload

    const updateFields: Partial<IUser> = { contact, name, job_role, school };

    if (image) updateFields.image = image;

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof IUser] === undefined || updateFields[key as keyof IUser] === '' || updateFields[key as keyof IUser] === null) {
            delete updateFields[key as keyof IUser];
        }
    });

    if (Object.keys(updateFields).length === 0) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid field found',
        );
    }

    const result = await User.updateOne({ _id: userId }, updateFields)

    return result

}

//get all users
const allUsers = async (query: Record<string, any>) => {
    const userModel = new QueryBuilder(User.find({ role: { $ne: '5' } }), query)
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();
    return {
        data,
        meta,
    };
}


const getUserById = async (id: string) => {
    const result = await User.findById(id, { password: 0, verification: 0 });
    return result;
};


//check user has a premium access for teacher addition
const checkUserHasPremiumAccess = async (userId: string) => {
    const userAccess = await Access_comments.findOne({ user: userId });

    if (!userAccess) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'You have not access for use premium feature',
        );
    }

    if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
        if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
            return
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your premium subscription expired !',
            );
        }
    } else {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Your premium subscription expired !',
        );
    }

}


//add new Teacher
const addTeacher = async (payload: { email: string, name: string, password: string }, userId: string) => {

    const isExist = await User.findOne({ email: payload?.email });

    //check teacher is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher has a another account',
        );
    }

    //check school admin has a premium package
    await checkUserHasPremiumAccess(userId)

    const hashedPassword = await bcrypt.hash(payload?.password, 15);

    const user = await User.create({ email: payload.email, role: '4', school_admin: userId, name: payload.name, password: hashedPassword });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Teacher creation failed');
    }

    return user;
};

//my school teachers
const mySchoolTeachers = async (query: Record<string, any>, userId: string) => {

    const userModel = new QueryBuilder(User.find({ role: "4", school_admin: userId }), query)
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();
    return {
        data,
        meta,
    };
    // return await User.find({ $or: [ { name: /sss/i } ] })
}

//delete a school teacher
const deleteSchool_teacher = async (id: string, userId: string) => {
    const isExist = await User.findById(id);

    if (!isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher not found',
        );
    }

    if ((!isExist?.school_admin.equals(userId)) && isExist.role !== '4') {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher is not your school',
        );
    }

    const deleted = await User.deleteOne({ _id: id })

    return deleted

}

//adTeacher
const updateSchoolTeacher = async (payload: { name: string, status: 0 | 1 }, id: string, userId: string) => {

    const isExist = await User.findOne({ _id: id, role: '4' });

    //check teacher is exist or not
    if (!isExist) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Teacher not found',
        );
    }

    if (!isExist.school_admin.equals(userId)) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not his school admin',
        );
    }


    const user = await User.updateOne({ _id: id }, { name: payload.name, status: payload?.status });

    if (user?.modifiedCount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Teacher update failed');
    }

    return user;
};

//user status update
const status_update_user = async (payload: { status: boolean }, id: string) => {

    const result = await User.updateOne({ _id: id }, { status: payload?.status })

    return result
}


//  add a new admin
const addSubAdmin = async (payload: IUser) => {
    const { name, email, password } = payload

    let isExist = await User.findOne({ email })

    //check user is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Another account founded with this email',
        );
    }

    // creat encrypted password
    const hashedPassword = await bcrypt.hash(password, 15);

    const user = await User.create({ email, name, password: hashedPassword, role: '6' });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Sub Admin creation failed');
    }

    return user;
}

//  get all new admin
const allSubAdmins = async () => {

    const users = await User.find({ role: '6' });

    return users;
}

//  delete sub admin
const deleteSubAdmin = async (id: string) => {

    let isExist = await User.findOne({ _id: id, role: '6' })

    //check user is exist or not
    if (!isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Sub Admin not found',
        );
    }

    const res = await User.deleteOne({ _id: id });

    return res;
}



export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    addTeacher,
    deleteSchool_teacher,
    mySchoolTeachers,
    status_update_user,
    updateSchoolTeacher,
    addSubAdmin,
    deleteSubAdmin,
    allSubAdmins
}