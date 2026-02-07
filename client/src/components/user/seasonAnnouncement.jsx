import { useEffect, useState, useRef, useContext } from "react";
import { appContext } from "../../context/appContext.jsx";

const SeasonAnnouncement = () => {
  const [getAnnouncement, setGetAnnouncement] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftArrow, setLeftArrow] = useState(false);
  const [rightArrow, setRightArrow] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const scrollRef = useRef(null);
  const autoplayRef = useRef(null);
  const { role } = useContext(appContext);

  

  useEffect(() => {
    setLoading(true); // Start loading
    fetch(`${import.meta.env.VITE_API_URL}/api/displayAnnouncement`, {
      method: "GET",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => {
        setGetAnnouncement(data);
      })
      .catch((err) => {
        console.log("Error: ", err.message);
      })
      .finally(() => {
        setLoading(false); // Stop loading
      });
  }, []);

  // Arrow visibility handler
  useEffect(() => {
    const checkScroll = scrollRef.current;

    const arrowVisibility = () => {
      if (checkScroll) {
        const { scrollLeft, scrollWidth, clientWidth } = checkScroll;
        setLeftArrow(scrollLeft > 0);
        setRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
      }
    };

    arrowVisibility();

    if (checkScroll) {
      checkScroll.addEventListener("scroll", arrowVisibility);
    }

    window.addEventListener("resize", arrowVisibility);

    return () => {
      if (checkScroll) {
        checkScroll.removeEventListener("scroll", arrowVisibility);
      }
      window.removeEventListener("resize", arrowVisibility);
    };
  }, [getAnnouncement]);

  // Autoplay functionality
  useEffect(() => {
    if (getAnnouncement.length > 1) {
      autoplayRef.current = setInterval(() => {
        handleScroll("right");
      }, 3500);

      return () => {
        if (autoplayRef.current) {
          clearInterval(autoplayRef.current);
        }
      };
    }
  }, [getAnnouncement, currentIndex]);

  const handleScroll = (direction) => {
    const checkScroll = scrollRef.current;

    if (checkScroll) {
      const scrollAmount = checkScroll.clientWidth;

      if (direction === "left") {
        checkScroll.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        // Check if we're at the end
        const { scrollLeft, scrollWidth, clientWidth } = checkScroll;
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          // Loop back to start
          checkScroll.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          checkScroll.scrollBy({
            left: scrollAmount,
            behavior: "smooth",
          });
        }
      }
    }
    // Reset autoplay timer
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(() => {
        handleScroll("right");
      }, 3500);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`container g-0`} style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.6s ease-in-out" }}>
      <div className="row g-0 justify-content-center overflow-hidden "
      style={{marginTop: role === "user" ?  "120px" : ""}}
      >
        <div className="col-12">
          {loading ? (
            // Minimalist loading spinner
            <div className="d-flex justify-content-center align-items-center" style={{height: "400px"}} >
              <div className="spinner-border" role="status" style={{ width: "40px", height: "40px", borderWidth: "3px", color: "#22c55e" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : getAnnouncement.length > 0 ? (
            <div className="position-relative overflow-hidden" style={{ borderRadius: "12px" }}>
              <div
                ref={scrollRef}
                className="d-flex"
                style={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                }}
              >
                <style>{`
                  .announcement-scroll::-webkit-scrollbar {
                    display: none;
                  }
                  .announcement-item {
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                  }
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                  .announcement-title {
                    font-size: clamp(1.75rem, 4vw, 2.8rem);
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    line-height: 1.2;
                    text-transform: capitalize;
                  }
                  .announcement-desc {
                    font-size: clamp(0.95rem, 1.8vw, 1.1rem);
                    font-weight: 400;
                    line-height: 1.6;
                    text-transform: capitalize;
                    opacity: 0.9;
                  }
                  .announcement-meta-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    opacity: 0.6;
                  }
                  .announcement-meta-value {
                    font-size: clamp(0.95rem, 1.8vw, 1.1rem);
                    font-weight: 500;
                    text-transform: capitalize;
                  }
                  .nav-btn {
                    transition: all 0.2s ease;
                    background: rgba(255, 255, 255, 0.85) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: none !important;
                  }
                  .nav-btn:hover {
                    background: rgba(255, 255, 255, 1) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  }
                `}</style>

                {getAnnouncement.map((item, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 announcement-item"
                    style={{
                      width: "100%",
                      scrollSnapAlign: "start",
                      animationDelay: `${index * 0.1}s`,
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div className="position-relative bg-transparent" style={{ overflow: "hidden" }}>
                      <img
                        src={
                          item.imageFile.startsWith("http")
                            ? item.imageFile
                            : `${import.meta.env.VITE_API_URL}/api/Uploads/${item.imageFile}` || "/fallback.jpg"
                        }
                        alt={item.title}
                        className="w-100"
                        style={{
                          height: "400px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <div
                        className="position-absolute bottom-0 start-0 w-100"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
                          padding: "clamp(1.5rem, 5vw, 2.5rem)",
                        }}
                      >
                        <div className="mb-3">
                          <p className="announcement-title text-white m-0">{item.title}</p>
                          <p className="announcement-desc text-white m-0 mt-2">{item.description}</p>
                        </div>

                        <div className="d-flex gap-3 gap-md-4 flex-wrap">
                          <div>
                            <p className="announcement-meta-label text-white m-0">Crop</p>
                            <p className="announcement-meta-value text-white m-0 mt-1">{item.cropName}</p>
                          </div>

                          <div>
                            <p className="announcement-meta-label text-white m-0">End Date</p>
                            <p className="announcement-meta-value text-white m-0 mt-1">{formatDate(item.endDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leftArrow && (
                <button
                  className="nav-btn fa-solid fa-chevron-left fs-6 position-absolute top-50 start-0 ms-3 translate-middle-y rounded-circle d-flex align-items-center justify-content-center z-1 d-none d-md-flex text-dark"
                  style={{ width: "44px", height: "44px" }}
                  onClick={() => handleScroll("left")}
                ></button>
              )}

              {rightArrow && (
                <button
                  className="nav-btn fa-solid fa-chevron-right fs-6 position-absolute top-50 end-0 me-3 translate-middle-y rounded-circle d-flex align-items-center justify-content-center z-1 d-none d-md-flex text-dark"
                  style={{ width: "44px", height: "44px" }}
                  onClick={() => handleScroll("right")}
                ></button>
              )}
            </div>
          ) : (
            <div className="p-4 d-flex align-items-center flex-column gap-2 text-center" style={{ minHeight: "250px", justifyContent: "center" }}>
              <i className="fa-solid fa-bell" style={{ fontSize: "2.5rem", opacity: 0.2 }}></i>
              <p className="text-muted m-0 mt-2" style={{ fontSize: "0.95rem" }}>No seasonal announcements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonAnnouncement;