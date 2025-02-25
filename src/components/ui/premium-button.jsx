import { useTranslation } from "react-i18next";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const PremiumButton = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchUserPremiumStatus = async () => {
      if (!user) return;

      try {
        const response = await axios.get(`http://localhost:3001/api/user/${user.id}`);
        setIsPremium(response.data.isPremium);
      } catch (error) {
        console.error('Ошибка получения статуса Premium:', error);
      }
    };

    fetchUserPremiumStatus();
  }, [user]);

  const handleCheckout = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/payments/create-checkout-session', {
        clerkUserId: user.id,
      });

      window.location.href = response.data.url;
    } catch (error) {
      toast.error(t("payment_error"));
    }
  };

  return (
    <Sheet className="z-9999">
      <SheetTrigger asChild>
        <button type="button" className={`btn ${isPremium ? 'btn-primary' : 'btn-warning'}`}>
          <i className="bi bi-gem me-2"></i>
          {isPremium ? t("premium_active") : t("premium")}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <SheetHeader>
            <SheetTitle>{t("premium_title")}</SheetTitle>
            <SheetDescription>{t("premium_description")}</SheetDescription>
          </SheetHeader>

          <div className="my-4 p-4 bg-primary rounded-lg shadow">
            <h3 className="text-lg font-bold text-white mb-2">{t("premium_benefits_title")}</h3>
            <ul className="list-disc list-inside text-white">
              <li>{t("premium_benefit_1")}</li>
              <li>{t("premium_benefit_3")}</li>
              <li>{t("premium_benefit_5")}</li>
              <li>
                <a
                  href="https://www.facebook.com/groups/763040732570299"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-white"
                >
                  {t("premium_benefit_2")}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex justify-center items-center my-4">
            <img src="/images/premium.png" alt="premium" className="" />
          </div>

          <div className="text-center my-4">
            <a
              href="https://foggy-macrame-d24.notion.site/1a281d115acf801eabf3e8a40c9f0a84?pvs=4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {t("how_it_works")}
            </a>
          </div>
        </div>

        <div className="mt-auto text-center text-lg font-semibold text-primary">
          {isPremium ? t("purchased") : (
            <button
              type="button"
              className="btn btn-primary w-full py-3 text-lg"
              onClick={handleCheckout}
            >
              {t("purchase")}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PremiumButton;
