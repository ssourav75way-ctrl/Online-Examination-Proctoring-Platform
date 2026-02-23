import { useGetActiveSessionsQuery, LiveSession } from "@/services/proctorApi";
import { format } from "date-fns";

interface ProctorLiveGalleryProps {
  institutionId: string;
}

export function ProctorLiveGallery({ institutionId }: ProctorLiveGalleryProps) {
  const { data, isLoading, isError } = useGetActiveSessionsQuery(
    { institutionId },
    { pollingInterval: 10000 },
  );

  const sessions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-slate-100 animate-pulse rounded-2xl"
            />
          ))}

        {isError && (
          <div className="col-span-full p-12 bg-rose-50 text-rose-700 rounded-3xl text-center font-bold">
            Failed to load live sessions.
          </div>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-slate-500 font-medium text-lg">
              No active exam sessions right now
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          sessions.map((session: LiveSession) => {
            const snapshot = session.snapshots?.[0];
            const candidate = session.enrollment.candidate;
            const exam = session.enrollment.exam;
            const pendingFlags = session._count.flags;

            return (
              <div
                key={session.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all duration-300"
              >
                {}
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  {snapshot ? (
                    <img
                      src={snapshot.imageUrl}
                      alt={candidate.firstName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-slate-500 animate-spin" />
                      <span className="text-xs font-mono">
                        Waiting for feed...
                      </span>
                    </div>
                  )}

                  {}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Live
                    </span>
                  </div>

                  {}
                  {pendingFlags > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-lg">
                      {pendingFlags} PENDING FLAGS
                    </div>
                  )}
                </div>

                {}
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 truncate">
                      {candidate.firstName} {candidate.lastName}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mb-3">
                    {exam.title}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-mono text-slate-400">
                      {snapshot
                        ? `Last seen ${format(new Date(snapshot.capturedAt), "HH:mm:ss")}`
                        : "Starting..."}
                    </span>
                    <button className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50">
                      View Details &rarr;
                    </button>
                  </div>
                </div>

                {}
                {snapshot &&
                  (snapshot.multipleFaces ||
                    !snapshot.faceDetected ||
                    snapshot.candidateAbsent) && (
                    <div className="absolute inset-0 bg-rose-900/10 pointer-events-none border-2 border-rose-500/50 rounded-2xl" />
                  )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
