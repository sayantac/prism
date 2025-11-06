import { useForm } from "react-hook-form";
import { MapPin, Plus, Edit } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface Address {
  id?: string;
  name: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  address_type: "home" | "work" | "other";
  is_default?: boolean;
}

interface AddressFormProps {
  selectedAddress?: Address;
  onAddressSelect: (address: Address) => void;
  savedAddresses?: Address[];
  onAddressCreate?: (address: Address) => void;
  onAddressUpdate?: (address: Address) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  selectedAddress,
  onAddressSelect,
  savedAddresses = [],
  onAddressCreate,
  onAddressUpdate,
}) => {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Address>();

  const onSubmit = (data: Address) => {
    if (editingAddress) {
      onAddressUpdate?.({ ...data, id: editingAddress.id });
      setEditingAddress(null);
    } else {
      onAddressCreate?.(data);
      setShowNewAddressForm(false);
    }
    reset();
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    reset(address);
    setShowNewAddressForm(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-medium text-base-content/80">
              Saved Addresses
            </h4>
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddress?.id === address.id
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-base-400"
                }`}
                onClick={() => onAddressSelect(address)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-medium">{address.name}</p>
                      {address.is_default && (
                        <span className="badge badge-primary badge-sm">
                          Default
                        </span>
                      )}
                      <span className="badge badge-secondary badge-sm">
                        {address.address_type}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70">
                      {address.street}
                      {address.apartment && `, ${address.apartment}`}
                    </p>
                    <p className="text-sm text-base-content/70">
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-base-content/70">
                        {address.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(address);
                    }}
                    icon={<Edit className="w-4 h-4" />}
                    className="btn-circle"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Address Button */}
        <Button
          variant="outline"
          onClick={() => setShowNewAddressForm(true)}
          icon={<Plus className="w-4 h-4" />}
          className="w-full"
        >
          Add New Address
        </Button>
      </div>

      {/* New Address Modal */}
      <Modal
        isOpen={showNewAddressForm}
        onClose={() => {
          setShowNewAddressForm(false);
          setEditingAddress(null);
          reset();
        }}
        title={editingAddress ? "Edit Address" : "Add New Address"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />

          <Input
            label="Street Address"
            placeholder="123 Main Street"
            icon={<MapPin className="w-5 h-5" />}
            error={errors.street?.message}
            {...register("street", { required: "Street address is required" })}
          />

          <Input
            label="Apartment, suite, etc. (optional)"
            placeholder="Apt 4B"
            {...register("apartment")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="New York"
              error={errors.city?.message}
              {...register("city", { required: "City is required" })}
            />
            <Input
              label="State"
              placeholder="NY"
              error={errors.state?.message}
              {...register("state", { required: "State is required" })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ZIP Code"
              placeholder="10001"
              error={errors.zip_code?.message}
              {...register("zip_code", { required: "ZIP code is required" })}
            />
            <Input
              label="Country"
              placeholder="United States"
              error={errors.country?.message}
              {...register("country", { required: "Country is required" })}
            />
          </div>

          <Input
            label="Phone Number (optional)"
            placeholder="+1 (555) 123-4567"
            {...register("phone")}
          />

          <div>
            <label className="label">
              <span className="label-text">Address Type</span>
            </label>
            <select
              className="select select-bordered w-full"
              {...register("address_type", {
                required: "Address type is required",
              })}
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewAddressForm(false);
                setEditingAddress(null);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
