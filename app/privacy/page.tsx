import { PrivacySettings } from "../components/PrivacySettings";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-[#F5F1E8] mb-2">
          Privacy & Security
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          Manage your privacy settings and encryption preferences
        </p>
      </div>
      <PrivacySettings />
    </div>
  );
}
