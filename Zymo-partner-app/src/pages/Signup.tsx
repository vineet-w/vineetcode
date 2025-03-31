import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { Car, Check } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { AccountType } from "../types/auth";
import { fetchProfile } from "../store/slices/profileSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";

const CARS_RANGES = ["0-5", "5-10", "10-20", "20-50", "50-100", "100+"];

interface StepProps {
  isActive: boolean;
  isCompleted: boolean;
  title: string;
  stepNumber: number;
  totalSteps: number;
  children?: React.ReactNode;
}

function Step({
  isActive,
  isCompleted,
  title,
  stepNumber,
  totalSteps,
  children,
}: StepProps) {
  return (
    <div className={`relative ${isActive ? "opacity-100" : "opacity-50"}`}>
      <div className="flex items-center">
        <div className="relative">
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
            ${
              isCompleted
                ? "bg-lime border-lime"
                : isActive
                ? "bg-lime-400 border-lime-400 text-white shadow-lg"
                : "bg-white border-gray-300 text-gray-500"
            }
          `}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : stepNumber}
          </div>
          {stepNumber < totalSteps && (
            <div
              className={`
              absolute top-1/2 left-full h-0.5 w-8 -translate-y-1/2 transition-colors duration-300
              ${isCompleted ? "bg-lime" : "bg-gray-300"}
            `}
            />
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3
            className={`
            text-lg font-medium transition-colors duration-300
            ${isActive ? "text-white" : "text-gray-400"}
          `}
          >
            {title}
          </h3>
          {isActive && children && (
            <div className="bg-white/10 rounded-xl text-white p-6 shadow-lg transition-all duration-300 ease-in-out transform hover:shadow-xl">
              {children}
            </div>
          )}
        </div>
      </div>
      {stepNumber < totalSteps && (
        <div className="ml-6 w-0.5 h-8 bg-gray-200" />
      )}
    </div>
  );
}

export function Signup() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    accountType: "" as AccountType,
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    cities: [] as string[],
    carsRange: "",
    bankAccount: "",
    ifscCode: "",
    upiId: "",
    visibility: 1,
  });
  const [cities, setCities] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // To control dropdown visibility
  const [searchTerm, setSearchTerm] = useState(""); // To filter cities
  const [showForm, setShowForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null); // Reference for dropdown
  const inputRef = useRef<HTMLInputElement>(null); // Reference for input

  useEffect(() => {
    async function fetchCities(query = "New") {
      // Default query to get initial results
      try {
        const functionsUrl = 'https://us-central1-zymo-prod.cloudfunctions.net/zymoPartner/';
        const response = await fetch(
          `${functionsUrl}cities/indian-cities`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          }
        );
        const data = await response.json();
        const cityNames = data.cities.map((city: string) =>
          city.split(",")[0].trim()
        );

        setCities(cityNames || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    }

    if (searchTerm.length > 1) {
      fetchCities(searchTerm); // Fetch when typing
    }
  }, [searchTerm]);

  const handleSelectChange = (city: string) => {
    const newCities = formData.cities.includes(city)
      ? formData.cities.filter((c) => c !== city)
      : [...formData.cities, city];

    setFormData({ ...formData, cities: newCities });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredCities = cities.filter((city: string) =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    setTimeout(() => {
      setShowForm(true);
    }, 200); // Delay of 500ms before showing the form

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const steps = [
    {
      title: "Account Type",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {["individual", "company"].map((type) => (
              <button
                key={type}
                type="button"
                className={`
                  px-4 py-3 border rounded-lg font-medium  hover:border-lime hover:shadow-sm hover:shadow-lime
                  ${
                    formData.accountType === type
                      ? "bg-lime text-black"
                      : "border-gray-200"
                  }
                `}
                onClick={() =>
                  setFormData({
                    ...formData,
                    accountType: type as AccountType,
                  })
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Account Credentials",
      content: (
        <div className="space-y-4 min-w-72">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e: { target: { value: any } }) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <Input
            id="password"
            label="Set Password"
            type="password"
            required
            value={formData.password}
            onChange={(e: { target: { value: any } }) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e: { target: { value: any } }) =>
              setFormData({
                ...formData,
                confirmPassword: e.target.value,
              })
            }
            error={
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword
                ? "Passwords don't match"
                : undefined
            }
          />
        </div>
      ),
    },
    {
      title: "Personal Information",
      content: (
        <div className="space-y-4 min-w-80">
          <Input
            id="fullName"
            label="Full Name"
            required
            value={formData.fullName}
            onChange={(e: { target: { value: any } }) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e: { target: { value: any } }) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            required
            value={formData.phone}
            onChange={(e: { target: { value: any } }) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <div className="">
            <label className="block text-sm px-1 font-medium mb-3">
              Cities Available
            </label>

            {/* Input Box with Dropdown */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={formData.cities.join(", ")} // Display selected cities as a comma-separated string
                readOnly
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown on click
                className="mt-1 pl-3 block w-full border text-white border-gray-500 rounded-2xl p-2 bg-lightgray dark:border-gray-700 shadow-sm focus:ring-lime focus:border-lime"
                placeholder="Select cities..."
              />

              {/* Dropdown */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 w-full mt-1 bg-lightgray 00 border text-white border-lime rounded-2xl shadow-lg max-h-60 overflow-y-auto z-10"
                >
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full p-2 border-b border-b-lime border-gray-300 bg-lightgray focus:ring-lime "
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        className="flex items-center space-x-2 p-2 hover:bg-lime/30  cursor-pointer"
                        onClick={() => handleSelectChange(city)} // Toggle checkbox when clicking the city
                      >
                        <span className="text-sm ">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display Selected Cities Below the Input */}
            <div className="mt-4">
              {formData.cities.map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center px-2 py-1 text-xs text-lightgray bg-lime rounded-full mr-2 mb-2"
                >
                  {city}
                  <button
                    type="button"
                    onClick={() => handleSelectChange(city)} // Deselect the city
                    className="ml-1 text-sm text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Number of Cars</label>
            <select
              value={formData.carsRange}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  carsRange: e.target.value,
                })
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-lightgray border border-gray-500 focus:outline-none focus:ring-lime focus:border-lime sm:text-sm rounded-2xl"
            >
              <option value="">Select a range</option>
              {CARS_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
        </div>
      ),
    },
    {
      title: "Bank Account Details",
      content: (
        <div className="space-y-4 max-w-72">
          <div>
            Please provide the bank account details where the payment will be
            transferred.
          </div>
          <Input
            id="bankAccount"
            label="Bank Account Number"
            required
            value={formData.bankAccount}
            onChange={(e: { target: { value: any } }) =>
              setFormData({
                ...formData,
                bankAccount: e.target.value,
              })
            }
          />
          <Input
            id="ifscCode"
            label="IFSC Code"
            required
            value={formData.ifscCode}
            onChange={(e: { target: { value: any } }) =>
              setFormData({
                ...formData,
                ifscCode: e.target.value,
              })
            }
          />
          <Input
            id="upiId"
            label="UPI ID (Optional)"
            value={formData.upiId}
            onChange={(e: { target: { value: any } }) =>
              setFormData({ ...formData, upiId: e.target.value })
            }
          />
        </div>
      ),
    },
    {
      title: "Terms and Conditions",
      content: (
        <div className="space-y-4 max-w-4xl">
          <div className="bg-white/10 p-6 rounded-xl">
            <div className="text-sm overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Vendor Agreement</h1>

                <p className="mb-6">
                  This Vendor Agreement ("Agreement") is a legally binding
                  contract between you ("Vendor") and Zep Tepi Technologies
                  Private Limited ("Zymo"), governing the terms under which you
                  list and rent vehicles through the Zymo platform.
                </p>

                <p className="mb-6 font-semibold">
                  By clicking "I Agree" and proceeding with listing your
                  vehicle(s) on Zymo, you acknowledge that you have read,
                  understood, and agree to be bound by the terms of this
                  Agreement.
                </p>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    1. Scope of Services
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Zymo provides a platform for Vendors to list their
                      vehicles for rental by customers.
                    </li>
                    <li>
                      Zymo will facilitate customer bookings, collect payments,
                      and remit the rental amount to the Vendor after deducting
                      its commission.
                    </li>
                    <li>
                      The Vendor remains responsible for the maintenance,
                      safety, and legal compliance of the listed vehicles.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    2. Commission and Payment Terms
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Zymo shall charge a 20% (excl. GST) commission on the
                      rental amount received from the customer.
                    </li>
                    <li>
                      Government charges, security deposits, and penalties for
                      traffic violations will not be subject to commission.
                    </li>
                    <li>
                      Payments shall be settled within 3 business after the
                      Vendor submits an invoice to Zymo.
                    </li>
                    <li>
                      In the event of customer cancellations, refunds will be
                      processed per the Vendor's cancellation policy, with Zymo
                      deducting applicable charges.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    3. Vendor Obligations
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Vendor shall ensure all listed vehicles are legally
                      registered, insured, and in roadworthy condition.
                    </li>
                    <li>
                      Vendor shall be solely responsible for customer support,
                      including servicing, claims, and complaints.
                    </li>
                    <li>
                      Vendor shall grant Zymo permission to use its logo and
                      promotional materials for marketing purposes.
                    </li>
                    <li>
                      Vendor shall provide Zymo with API access for business
                      integration, if applicable.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    4. Customer Deposits (if applicable)
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Zymo will collect a refundable security deposit from
                      customers upon booking.
                    </li>
                    <li>
                      The Vendor must notify Zymo of any deductions (e.g.,
                      additional kilometres, damages) within 36 hours of trip
                      completion.
                    </li>
                    <li>
                      If the Vendor fails to respond within 48 hours after the
                      trip ends, Zymo reserves the right to refund the deposit
                      to the customer.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    5. Termination and Notice
                  </h2>
                  <p>
                    Zymo may immediately suspend or terminate the Vendor's
                    access to the platform in case of fraudulent activity, legal
                    violations, or breach of contract.
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">6. Indemnification</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      The Vendor agrees to indemnify and hold Zymo harmless
                      against any claims, damages, or legal disputes arising
                      from the rental and operation of the vehicles.
                    </li>
                    <li>
                      Zymo shall not be liable for any losses incurred due to
                      Vendor's non-compliance with laws or failure to fulfil
                      service obligations.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">7. Confidentiality</h2>
                  <p>
                    Both parties agree to maintain the confidentiality of
                    proprietary business information and customer data.
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">8. Force Majeure</h2>
                  <p>
                    Neither party shall be liable for failure to perform
                    obligations due to circumstances beyond their reasonable
                    control, including natural disasters, government
                    restrictions, or system failures.
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    9. Dispute Resolution
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Any disputes shall be resolved through mutual discussion.
                    </li>
                    <li>
                      If unresolved, disputes shall be referred to a sole
                      arbitrator appointed mutually by the parties, with
                      arbitration proceedings held in Mumbai, India, under the
                      Arbitration and Conciliation Act, 1996.
                    </li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">10. Governing Law</h2>
                  <p>
                    This Agreement shall be governed by and construed in
                    accordance with the laws of India.
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    11. Acceptance of Terms
                  </h2>
                  <p>
                    By proceeding to list vehicles on Zymo, the Vendor agrees to
                    the terms of this Agreement.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex mt-4 gap-1">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 text-lime rounded focus:ring-lime"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm">
              I acknowledge that I have read, understood, and agree to the above
              Terms and Conditions.
            </label>
          </div>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on the last step, move to next step
    if (currentStep < steps.length) {
      // Validate current step
      if (currentStep === 1 && !formData.accountType) {
        setError("Please select an account type");
        return;
      }
      if (currentStep === 2) {
        if (
          !formData.email ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          setError("Please fill in all fields");
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }
      }
      if (currentStep === 3) {
        if (!formData.fullName || !formData.email || !formData.phone) {
          setError("Please fill in all required fields");
          return;
        }
        if (formData.cities.length === 0) {
          setError("Please select at least one city");
          return;
        }
        if (!formData.carsRange) {
          setError("Please select number of cars");
          return;
        }
      }
      if (currentStep === 4) {
        if (!formData.bankAccount || !formData.ifscCode) {
          setError("Please fill in all required fields");
          return;
        }
      }

      setCurrentStep(currentStep + 1);
      setError(null);
      return;
    }

    // On final step, submit the form
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Formdata: ", formData);
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log("Created", user);
      const userRef = doc(db, "partnerWebApp", user.uid);
      await setDoc(userRef, {
        username: formData.email,
        accountType: formData.accountType,
        fullName: formData.fullName,
        phone: formData.phone,
        cities: formData.cities,
        carsRange: formData.carsRange,
        bankAccount: formData.bankAccount,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: formData.visibility, // Include visibility field
      });
      setTimeout(() => {
        dispatch(fetchProfile());
      }, 1000); // Small delay to allow Firestore update

      navigate("/home");
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-montserrat bg-darkgray flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl min-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-lime shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <Car className="h-10 w-10 " />
          </div>
          <h2 className="text-4xl font-extrabold text-lime mb-2">
            Create your account
          </h2>
          <p className="text-lg text-white">
            Complete the following steps to get started
          </p>
        </div>

        <div className="border border-lime backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {steps.map((step, index) => (
                <Step
                  key={step.title}
                  title={step.title}
                  stepNumber={index + 1}
                  totalSteps={steps.length}
                  isActive={currentStep === index + 1}
                  isCompleted={currentStep > index + 1}
                >
                  {step.content}
                </Step>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 bg-white "
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                isLoading={isLoading}
                className={`px-6 bg-lime ${currentStep === 1 ? "ml-auto" : ""}`}
              >
                {currentStep === steps.length ? "Create Account" : "Next"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
