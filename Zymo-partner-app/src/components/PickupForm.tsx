import { useCallback, useEffect, useState } from "react";

interface PickupFormProps {
  city: string;
  onLocationChange: (location: string) => void;
}

const PickupForm: React.FC<PickupFormProps> = ({ city, onLocationChange }) => {
  const [address, setAddress] = useState<string>("");
  const inputId = `autocomplete-${city.replace(/\s+/g, '-').toLowerCase()}`;

  const loadGoogleMapsScript = useCallback(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("Google API Key is missing");
      return;
    }

    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeAutocomplete(inputId);
      document.head.appendChild(script);
    } else {
      initializeAutocomplete(inputId);
    }
  }, [inputId]);

  const initializeAutocomplete = useCallback((id: string) => {
    if (typeof window !== "undefined" && window.google) {
      const input = document.getElementById(id) as HTMLInputElement;
      if (!input) return;

      const options = {
        types: ["geocode"],
        componentRestrictions: { country: "IN" },
      };

      const autocompleteInstance = new window.google.maps.places.Autocomplete(input, options);
      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();
        if (place?.formatted_address) {
          setAddress(place.formatted_address);
          onLocationChange(place.formatted_address);
        }
      });
    }
  }, [onLocationChange]);

  useEffect(() => {
    loadGoogleMapsScript();
  }, [loadGoogleMapsScript]);

  return (
    <div className="p-1">
      <h2 className="mb-1  text-white text-sm">Pickup Location for {city}</h2>
      <div className="mb-1">
        <input
          id={inputId}
          type="text"
          className="w-full p-2 border  bg-lightgray  text-white border-lightgray rounded-xl text-sm"
          placeholder={`Search for pickup location in ${city}`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>     
    </div>
  );
};

export default PickupForm;