import { useEffect, useState, useRef, useContext } from "react";
import { appContext } from "../../context/appContext.jsx";




const SeasonAnnouncement = () => {
  const [getAnnouncement, setGetAnnouncement] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftArrow, setLeftArrow] = useState(false);
  const [rightArrow, setRightArrow] = useState(false);
  const scrollRef = useRef(null);
  const autoplayRef = useRef(null);
  const { role } = useContext(appContext);

  

  useEffect(() => {
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
      <div className={`container  g-0`}  style={{marginTop: role === "user" ?  "110px" : ""}}>
        <div className="row g-0 justify-content-center overflow-hidden">
          <div className="col-12">
            {getAnnouncement.length > 0 ? (
              <div className="position-relative overflow-hidden">
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
                  `}</style>

                  {getAnnouncement.map((item, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0"
                      style={{
                        width: "100%",
                        scrollSnapAlign: "start",
                      }}
                    >
                      <div className="position-relative bg-transparent  "
                      style={{overflow: "hidden"}}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL}/api/Uploads/${item.imageFile}` || "/fallback.jpg"}
                          alt={item.title}
                          className="w-100 "
                          style={{
                            height: "450px",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          className="position-absolute bottom-0 start-0 w-100 p-4"
                          style={{
                          background:
                              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.85) 80%, rgba(255,255,255,0.95) 100%)",
                          }}
                        >
                          <div className="mb-3">
                            <p className="m-0 fw-bold text-capitalize fs-1 text-dark">
                              {item.title}
                            </p>
                            <p className="m-0 text-capitalize text-wrap fw-bold ">
                              {item.description}
                            </p>
                          </div>

                          <div className="d-flex gap-5">
                            <div>
                              <p className="m-0 text-capitalize small">
                                Crop name
                              </p>
                              <p className="m-0 fw-bold text-capitalize text-success">
                                {item.cropName}.
                              </p>
                            </div>

                            <div>
                              <p className="m-0 text-capitalize small">
                                End Date
                              </p>
                              <p className="m-0 fw-bold text-capitalize text-success">
                                {formatDate(item.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {leftArrow && (
                  <button
                    className="fa-solid fa-chevron-left fs-6 bg-light position-absolute top-50 start-0 ms-3
                    translate-middle-y border-0 rounded-circle shadow-sm d-flex align-items-center
                    justify-content-center z-1 d-none d-md-flex text-success"
                    style={{ width: "45px", height: "45px" }}
                    onClick={() => handleScroll("left")}
                  ></button>
                )}

                {rightArrow && (
                  <button
                    className="fa-solid fa-chevron-right fs-6 bg-light position-absolute top-50 end-0 me-3
                    translate-middle-y border-0 rounded-circle shadow-sm d-flex align-items-center 
                    justify-content-center z-1 d-none d-md-flex text-success"
                    style={{ width: "45px", height: "45px" }}
                    onClick={() => handleScroll("right")}
                  ></button>
                )}
              </div>
            ) : (
              <div className="mt-5 p-5 d-flex align-items-center flex-column gap-2">
                <i className="fa-solid fa-bell fs-3 text-muted"></i>
                <p className="text-center text-muted">No annoucement season yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default SeasonAnnouncement;