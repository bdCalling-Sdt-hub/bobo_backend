import { Request, Response } from "express"
import catchAsync from "../../utils/catchAsync"
import { packageService } from "./package.service"
import sendResponse from "../../utils/sendResponse"

const createPackage = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.create_Package(req.body)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Packages created successfully',
        data: result,
    });
})

const updatePackage = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.update_Package(req.body, req.params.id)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Packages updated successfully',
        data: result,
    });
})

const getPackages_by_type = catchAsync(async (req: Request<{}, {}, {}, { type?: "standard" | "premium" }>, res: Response) => {

    const result = await packageService.getPackages_by_type(req.query.type)

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Packages retrived successfully',
        data: result,
    });

})

export const packageControler = {
    createPackage,
    updatePackage,
    getPackages_by_type
}