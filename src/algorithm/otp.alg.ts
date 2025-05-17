import otpGenerator from "otp-generator";

const generateOtp = (length: number = 4): string => {
    return otpGenerator.generate(length, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
};

export default generateOtp;