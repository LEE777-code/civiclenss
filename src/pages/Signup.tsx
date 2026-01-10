import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, User, Mail, Phone, Lock, Calendar, MapPin } from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { setAuthState } from "@/services/authService";

const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
  "The Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
  "Salem", "Sivagangai", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi",
  "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvarur",
  "Tiruvallur", "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
];

const COUNTRY_CODES = [
  { code: "+91", country: "IN" },
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
];

const Signup = () => {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    dob: "",
    age: "",
    gender: "",
    district: "",
    password: "",
    confirmPassword: "",
  });

  // Auto-calculate age
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.dob]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(" ")[0],
        lastName: formData.fullName.split(" ").slice(1).join(" "),
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
      toast.success("Please check your email for the verification code");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Something went wrong";
      toast.error(errorMsg);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        // Set auth state in localStorage
        setAuthState(completeSignUp.createdUserId!);

        // Save to Supabase
        const { error } = await supabase.from('users').insert({
          clerk_id: completeSignUp.createdUserId,
          email: formData.email,
          full_name: formData.fullName,
          phone: `${formData.countryCode}${formData.phone}`,
          gender: formData.gender,
          district: formData.district,
          age: parseInt(formData.age),
          dob: formData.dob,
          profile_completed: true,
        });

        if (error) {
          console.error("Supabase error:", error);
          // Even if Supabase fails, user is created in Clerk. 
          // They might be redirected to Edit Profile by the Login logic anyway.
        }

        navigate("/home");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        toast.error("Verification failed");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      toast.error(err.errors?.[0]?.message || "Verification failed");
    }
  };

  if (verifying) {
    return (
      <div className="mobile-container min-h-screen bg-background px-6 py-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Verify Email</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Enter the code sent to {formData.email}
        </p>
        <form onSubmit={handleVerify} className="w-full space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Verification Code"
            className="input-field text-center tracking-widest text-xl"
          />
          <button type="submit" className="btn-primary">
            Verify & Create Account
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background px-6 py-8">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3">
          <Shield size={28} className="text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-primary">CivicLens</h1>
      </div>

      <h2 className="text-2xl font-bold text-foreground text-center mb-6">
        Create Your Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="input-field pl-12"
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="input-field pl-12"
            required
          />
        </div>

        {/* Phone */}
        <div className="flex gap-2">
          <select
            name="countryCode"
            value={formData.countryCode}
            onChange={handleChange}
            className="input-field w-24"
          >
            {COUNTRY_CODES.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.code}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="input-field pl-12"
              required
            />
          </div>
        </div>

        {/* DOB & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Gender */}
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not">Prefer not to say</option>
        </select>

        {/* District */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="input-field pl-12"
            required
          >
            <option value="">Select District</option>
            {DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="input-field pl-12 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field pl-12"
            required
          />
        </div>

        <div id="clerk-captcha"></div>
        <button type="submit" className="btn-primary mt-6">
          Create Account
        </button>
      </form>

      <p className="text-center mt-6 text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/login")}
          className="text-primary font-semibold"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
