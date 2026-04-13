import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#2B262C]">
      <SignUp
        appearance={{
          elements: {
            card: "bg-card dark:bg-[#3a3436] border border-border dark:border-gray-700 shadow-sm rounded-xl",
            headerTitle: "text-foreground dark:text-[#F5F1E8]",
            headerSubtitle: "text-muted-foreground",
            formFieldInput:
              "bg-background dark:bg-[#2B262C] border-border dark:border-gray-600 text-foreground dark:text-[#F5F1E8]",
            formButtonPrimary:
              "bg-[#2B262C] dark:bg-[#F5F1E8] text-[#F5F1E8] dark:text-[#2B262C] hover:opacity-90",
            footerActionLink: "text-[#2B262C] dark:text-[#F5F1E8] hover:opacity-70",
          },
        }}
        signInUrl="/sign-in"
      />
    </div>
  );
}
