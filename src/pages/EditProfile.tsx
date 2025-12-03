import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

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
  // Add more as needed
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    dob: "",
    age: "",
    gender: "",
    district: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));

      // Check if user already exists in Supabase to pre-fill
      const fetchUserData = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_id', user.id)
            .single();

          if (data) {
            setFormData(prev => ({
              ...prev,
              phone: data.phone || "",
              dob: data.dob || "", // Assuming you have a dob column, if not it might be in metadata
              age: data.age?.toString() || "",
              gender: data.gender || "",
              district: data.district || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      fetchUserData();
    }
  }, [user]);

  // Auto-calculate age from DOB
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

  const handleSave = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.dob || !formData.gender || !formData.district || !formData.age) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (!user) return;

      const userData = {
        clerk_id: user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: `${formData.countryCode}${formData.phone}`,
        gender: formData.gender,
        district: formData.district,
        age: parseInt(formData.age),
        dob: formData.dob, // Ensure your Supabase table has this column or remove if not
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Upsert user data
      const { error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'clerk_id' });

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate("/home"); // Redirect to home after completion
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-background relative">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
<<<<<<< HEAD
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
=======
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
>>>>>>> c7bc9f6bf0a7ed97afe4bf735db5ba60bda01f9d
              ) : (
                <User size={48} className="text-primary" />
              )}
            </div>
            <button
              onClick={() => setShowImageOptions(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Camera size={16} className="text-primary-foreground" />
            </button>
          </div>
<<<<<<< HEAD
          <h2 className="text-xl font-bold text-foreground mt-4">{formData.fullName || "User"}</h2>
          <button className="text-primary text-sm font-medium mt-1">Change Photo</button>
=======
          <h2 className="text-xl font-bold text-foreground mt-4">{formData.fullName}</h2>
          <button
            onClick={() => setShowImageOptions(true)}
            className="text-primary text-sm font-medium mt-1"
          >
            Change Photo
          </button>
>>>>>>> c7bc9f6bf0a7ed97afe4bf735db5ba60bda01f9d
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input-field"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="input-field opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="input-field w-24"
              >
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.code} value={cc.code}>
                    {cc.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field flex-1"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input-field"
                placeholder="Age"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="input-field"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not">Prefer not to say</option>
            </select>
          </div>
<<<<<<< HEAD

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">District</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="input-field"
            >
              <option value="">Select District</option>
              {DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
=======
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">District</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            className="input-field"
          />
        </div>
>>>>>>> c7bc9f6bf0a7ed97afe4bf735db5ba60bda01f9d
      </div>

      <button onClick={handleSave} className="btn-primary mt-8">
        Save Changes
      </button>

      {/* Image Selection Modal */}
      {showImageOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-background w-full max-w-sm rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-10 fade-in">
            <h3 className="text-lg font-semibold text-center mb-2">Select Image Source</h3>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <Camera className="text-primary" size={24} />
              <span className="font-medium">Take Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <div className="w-6 h-6 border-2 border-primary rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <span className="font-medium">Choose from Gallery</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <button
              onClick={() => setShowImageOptions(false)}
              className="w-full py-3 text-center font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default EditProfile;
