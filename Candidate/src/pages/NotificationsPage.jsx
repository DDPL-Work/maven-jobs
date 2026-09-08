import { useEffect, useState } from "react";
import { Badge, PageState, PanelCard, SectionHeading } from "../components/Ui";
import { formatDateTime } from "../utils/formatters";
import { getNotifications, markNotificationRead } from "../services/candidateApi";

export default function NotificationsPage() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      setState({
        loading: false,
        error: "",
        data: response.data,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || "Unable to load notifications.",
        data: [],
      });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch {
      // Keep the rest of the page usable.
    }
  };

  if (state.loading) {
    return (
      <PageState
        title="Loading notifications"
        description="Fetching alerts, campaigns, and application updates."
      />
    );
  }

  if (state.error) {
    return (
      <PageState
        title="Notifications unavailable"
        description={state.error}
        error
      />
    );
  }

  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = state.data.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(state.data.length / notificationsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <PanelCard>
      <SectionHeading
        eyebrow="Candidate Alerts"
        title="Review every notification in one place"
        description="CRM campaigns, profile reminders, and application status changes flow into this inbox."
      />

      <div className="mt-6 space-y-4">
        {currentNotifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:border-lime-300 hover:bg-white"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {notification.title}
                  </h3>
                  <Badge tone={notification.status === "READ" ? "slate" : "lime"}>
                    {notification.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {notification.message}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
              {notification.status !== "READ" ? (
                <button
                  onClick={() => handleRead(notification.id)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-lime-300 hover:bg-lime-50 hover:text-[#163060]"
                >
                  Mark as read
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-lime-300 hover:bg-lime-50 hover:text-[#163060] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-700"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-500">
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-lime-300 hover:bg-lime-50 hover:text-[#163060] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </PanelCard>
  );
}
