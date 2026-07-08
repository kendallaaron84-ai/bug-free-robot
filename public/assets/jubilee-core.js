/**
 * KOBA-I JUBILEE WORKS: Universal Agnostic Rendering Engine
 * Refactored for robust React 18 concurrent mounting, E-Reader Pagination, Video/Audio natively, and Anti-Piracy Shield.
 */

(function() {
    console.log("[KOBA-I] Engine script initialized. Verifying execution context...");

    // ==========================================
    // 1. THE MEDIA PLAYER COMPONENT (Audio + Video)
    // ==========================================
    const JubileePlayerApp = ({ assetId, studioKey, config, onClose }) => {
        const { useState, useEffect, useRef, createElement: e } = window.React;
        const [status, setStatus] = useState('loading'); // loading, ready, error
        const [errorMsg, setErrorMsg] = useState('');
        const [assetData, setAssetData] = useState(null);
        const [mediaUrl, setMediaUrl] = useState(null);
        
        // Refs for direct DOM manipulation to save RAM on mobile webviews
        const mediaRef = useRef(null);
        const progressContainerRef = useRef(null);
        const progressBarRef = useRef(null);
        const timeRef = useRef(null);
        const playBtnRef = useRef(null);

        useEffect(() => {
            let isMounted = true;

            const fetchSaaSData = async () => {
                try {
                    // First, get the asset metadata
                    const response = await fetch(`${config.endpoints.publicProduct}?assetId=${assetId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Studio-Key': studioKey
                        }
                    });

                    const data = await response.json();
                    if (!isMounted) return;

                    if (!response.ok || data.error) {
                        throw new Error(data.error || "Asset Not Found");
                    }
                    
                    setAssetData(data);
                    
                    // In a real flow, here we would trigger SMS Auth or retrieve a signed URL
                    // For now, we simulate unlocking the asset and using its storagePath/url
                    const url = data.mediaUrl || data.signedUrl || "https://www.w3schools.com/html/mov_bbb.mp4"; // placeholder
                    setMediaUrl(url);
                    setStatus('ready');

                } catch (error) {
                    if (!isMounted) return;
                    console.error("[KOBA-I Player] Jubilee Cloud Error:", error);
                    setErrorMsg(error.message);
                    setStatus('error');
                }
            };

            fetchSaaSData();
            return () => { isMounted = false; };
        }, [assetId, studioKey]);

        // Anti-Piracy Shield & Event Bindings
        useEffect(() => {
            if (status !== 'ready' || !mediaRef.current) return;

            const media = mediaRef.current;
            const isAudio = media.tagName.toLowerCase() === 'AUDIO';

            // Anti-Piracy Shield (Audio only for now, Web Audio API)
            if (isAudio && window.AudioContext) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioCtx.createMediaElementSource(media);
                    
                    // 19kHz-21kHz Oscillator (Inaudible to humans, ruins rips)
                    const osc = audioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(20000, audioCtx.currentTime); // 20kHz
                    
                    // Digitize signature via math layer (simulated by modulating frequency slightly)
                    const mod = audioCtx.createOscillator();
                    mod.type = 'sawtooth';
                    mod.frequency.setValueAtTime(2, audioCtx.currentTime);
                    
                    const gain = audioCtx.createGain();
                    gain.gain.value = 50;
                    mod.connect(gain);
                    gain.connect(osc.frequency);
                    
                    osc.start();
                    mod.start();

                    // Mix original audio with the silent high-frequency signal
                    source.connect(audioCtx.destination);
                    osc.connect(audioCtx.destination);
                    
                    console.log("[KOBA-I Player] Anti-Piracy Web Audio Shield Engaged.");
                } catch (e) {
                    console.warn("AudioContext Anti-Piracy routing failed (likely CORS or already bound).", e);
                }
            }

            // Direct DOM Event Binding (Bypass React State for Performance)
            const formatTime = (seconds) => {
                if (isNaN(seconds)) return "00:00";
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
            };

            const updateProgress = () => {
                if (!media.duration) return;
                const percent = (media.currentTime / media.duration) * 100;
                if (progressBarRef.current) progressBarRef.current.style.width = `${percent}%`;
                if (timeRef.current) timeRef.current.textContent = `${formatTime(media.currentTime)} / ${formatTime(media.duration)}`;
            };

            const togglePlay = () => {
                if (media.paused) {
                    media.play();
                } else {
                    media.pause();
                }
            };

            const onPlay = () => { if (playBtnRef.current) playBtnRef.current.innerHTML = '⏸'; };
            const onPause = () => { if (playBtnRef.current) playBtnRef.current.innerHTML = '▶'; };
            
            const scrub = (e) => {
                if (!progressContainerRef.current) return;
                const rect = progressContainerRef.current.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                media.currentTime = pos * media.duration;
            };

            media.addEventListener('timeupdate', updateProgress);
            media.addEventListener('play', onPlay);
            media.addEventListener('pause', onPause);
            
            if (playBtnRef.current) playBtnRef.current.addEventListener('click', togglePlay);
            if (progressContainerRef.current) {
                progressContainerRef.current.addEventListener('click', scrub);
                // Basic touch support
                progressContainerRef.current.addEventListener('touchstart', (e) => scrub(e.touches[0]));
                progressContainerRef.current.addEventListener('touchmove', (e) => scrub(e.touches[0]));
            }

            return () => {
                media.removeEventListener('timeupdate', updateProgress);
                media.removeEventListener('play', onPlay);
                media.removeEventListener('pause', onPause);
            };
        }, [status]);

        if (status === 'loading') {
            return e('div', { style: { position: 'fixed', inset: 0, zIndex: 999999, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' } }, 'Decrypting Secure Stream...');
        }

        if (status === 'error') {
            return e('div', { style: { position: 'fixed', inset: 0, zIndex: 999999, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'sans-serif', padding: '20px' } }, 
                e('div', { style: { fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' } }, 'Failed to load secure asset.'),
                e('div', { style: { fontSize: '14px', color: '#94a3b8', marginBottom: '20px' } }, errorMsg),
                e('button', { onClick: onClose, style: { padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Close Player')
            );
        }

        const isVideo = assetData?.type?.toLowerCase() === 'video' || (mediaUrl && mediaUrl.endsWith('.mp4'));

        // Render Media Nodes
        const mediaNode = e(isVideo ? 'video' : 'audio', {
            ref: mediaRef,
            src: mediaUrl,
            crossOrigin: "anonymous",
            style: isVideo ? { width: '100%', height: '100%', objectFit: 'contain' } : { display: 'none' }
        });

        // Customized Touch-Friendly Controls
        const controls = e('div', {
            style: {
                position: 'absolute', bottom: '20px', left: '20px', right: '20px',
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
                borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
            }
        },
            // Progress Bar
            e('div', {
                ref: progressContainerRef,
                style: { width: '100%', height: '8px', background: '#334155', borderRadius: '4px', cursor: 'pointer', position: 'relative' }
            },
                e('div', { ref: progressBarRef, style: { width: '0%', height: '100%', background: '#10b981', borderRadius: '4px', pointerEvents: 'none' } })
            ),
            // Bottom Row
            e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' } },
                e('button', { ref: playBtnRef, style: { background: 'transparent', border: 'none', color: '#10b981', fontSize: '24px', cursor: 'pointer', padding: 0 } }, '▶'),
                e('div', { ref: timeRef, style: { fontSize: '14px', fontFamily: 'monospace' } }, '00:00 / 00:00')
            )
        );

        return e('div', {
            style: {
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                zIndex: 999999, backgroundColor: '#0f172a',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                animation: 'fadeIn 0.3s ease-in-out'
            }
        },
            e('button', {
                onClick: onClose,
                style: { position: 'absolute', top: '20px', right: '20px', zIndex: 1000000, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }
            }, '×'),
            isVideo ? mediaNode : e('div', { style: { textAlign: 'center' } }, 
                e('img', { src: assetData.coverArtUrl || '/placeholder.jpg', style: { width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', marginBottom: '20px' } }),
                e('h2', { style: { color: '#fff', fontSize: '24px', margin: 0 } }, assetData.title || 'Unknown Title'),
                mediaNode
            ),
            controls
        );
    };

    // ==========================================
    // 2. THE E-READER ENGINE (RAG Lore + Pagination)
    // ==========================================
    const JubileeReaderApp = ({ assetId, studioKey, config, onClose }) => {
        const { useState, useEffect, useRef, createElement: e } = window.React;
        const [content, setContent] = useState('');
        const [lore, setLore] = useState(null);
        const [currentPage, setCurrentPage] = useState(0);
        const contentRef = useRef(null);
        
        useEffect(() => {
            // Fetch book data (mocked for now, assumes HTML content is returned)
            setContent("<h2>Chapter 1</h2><p>The neon rain slicked the streets of neo-Tokyo...</p>".repeat(50));
            setLore({
                synopsis: "Duncan the Man Hunter takes on his biggest bounty yet.",
                characterContext: "Duncan is a cybernetically enhanced bounty hunter.",
                activeConstraints: "Tone: Cyberpunk Noir. Reading Level: Adult."
            });
        }, [assetId]);

        const handleSwipe = (direction) => {
            if (!contentRef.current) return;
            const colWidth = contentRef.current.clientWidth;
            const scrollWidth = contentRef.current.scrollWidth;
            const maxPages = Math.ceil(scrollWidth / colWidth) - 1;
            
            if (direction === 'left' && currentPage < maxPages) setCurrentPage(p => p + 1);
            if (direction === 'right' && currentPage > 0) setCurrentPage(p => p - 1);
        };

        // Touch handling
        const touchStartX = useRef(0);
        const onTouchStart = (e) => touchStartX.current = e.touches[0].clientX;
        const onTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX.current - touchEndX > 50) handleSwipe('left');
            if (touchStartX.current - touchEndX < -50) handleSwipe('right');
        };

        return e('div', { style: { position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: '#0f172a', display: 'flex', color: '#cbd5e1' } },
            // RAG Lore Sidebar
            e('div', { style: { width: '280px', flexShrink: 0, backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '24px', overflowY: 'auto' } },
                e('h3', { style: { color: '#f97316', marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' } }, 'RAG Lore Cortex', e('button', { onClick: onClose, style: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' } }, '×')),
                lore && e('div', { style: { fontSize: '13px', lineHeight: 1.6 } },
                    e('div', { style: { marginBottom: '16px' } }, e('strong', { style: { color: '#10b981' } }, 'Synopsis:'), e('br'), lore.synopsis),
                    e('div', { style: { marginBottom: '16px' } }, e('strong', { style: { color: '#10b981' } }, 'Context:'), e('br'), lore.characterContext),
                    e('div', { style: { marginBottom: '16px' } }, e('strong', { style: { color: '#10b981' } }, 'Constraints:'), e('br'), lore.activeConstraints),
                )
            ),
            // Reader Canvas (Horizontal Pagination)
            e('div', { 
                style: { flex: 1, position: 'relative', overflow: 'hidden', padding: '40px' },
                onTouchStart: onTouchStart,
                onTouchEnd: onTouchEnd
            },
                e('div', { 
                    ref: contentRef,
                    dangerouslySetInnerHTML: { __html: content },
                    style: {
                        columnWidth: 'calc(100vw - 360px)',
                        columnGap: '80px',
                        columnFill: 'auto',
                        height: '100%',
                        fontFamily: 'Georgia, serif',
                        fontSize: '18px',
                        lineHeight: 1.8,
                        color: '#f8fafc',
                        transform: `translateX(calc(-${currentPage} * (100vw - 280px)))`,
                        transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    }
                }),
                // Desktop navigation buttons
                e('button', { onClick: () => handleSwipe('right'), style: { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '50%', cursor: 'pointer' } }, '←'),
                e('button', { onClick: () => handleSwipe('left'), style: { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '50%', cursor: 'pointer' } }, '→')
            )
        );
    };

    // ==========================================
    // 3. THE STOREFRONT CATALOG
    // ==========================================
    const JubileeCatalogApp = ({ studioKey, config }) => {
        const { useState, useEffect, createElement: e } = window.React;
        const [books, setBooks] = useState([]);
        const [loading, setLoading] = useState(true);
        const [activeAssetId, setActiveAssetId] = useState(null);
        const [activeType, setActiveType] = useState(null);

        useEffect(() => {
            const fetchCatalog = async () => {
                try {
                    const res = await fetch(`${config.endpoints.publicProduct}?studioKey=${studioKey}`);
                    const data = await res.json();
                    setBooks(Array.isArray(data) ? data : data.products || []);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                }
            };
            if (studioKey) fetchCatalog();
        }, [studioKey]);

        if (loading) return e('div', null, 'Loading Catalog...');

        const grid = e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' } },
            books.map(book => e('div', {
                key: book.id,
                onClick: () => { setActiveAssetId(book.id); setActiveType(book.type); },
                style: { cursor: 'pointer', background: '#1e293b', borderRadius: '12px', overflow: 'hidden', color: '#fff' }
            },
                e('img', { src: book.coverArtUrl, style: { width: '100%', aspectRatio: '2/3', objectFit: 'cover' } }),
                e('div', { style: { padding: '16px' } }, e('h3', { style: { margin: 0 } }, book.title))
            ))
        );

        return e('div', { className: 'jubilee-catalog-wrapper' },
            grid,
            activeAssetId && activeType === 'ebook' && e(JubileeReaderApp, { assetId: activeAssetId, studioKey, config, onClose: () => setActiveAssetId(null) }),
            activeAssetId && activeType !== 'ebook' && e(JubileePlayerApp, { assetId: activeAssetId, studioKey, config, onClose: () => setActiveAssetId(null) })
        );
    };

    // ==========================================
    // 4. SYSTEM BOOTSTRAP (Race Condition Defense)
    // ==========================================
    const bootKobaSystems = () => {
        // Robust Polling for React dependencies
        if (!window.React || !window.ReactDOM) {
            console.warn("[KOBA-I] Waiting for React 18 CDN...");
            setTimeout(bootKobaSystems, 50);
            return;
        }

        const { createElement: e } = window.React;
        const config = window.JubileeConfig || { endpoints: { publicProduct: "/api/products/public" } };
        
        // 1. Mount Catalog
        const catalogNode = document.getElementById("jubilee-catalog-root");
        if (catalogNode && !catalogNode.hasAttribute('data-mounted')) {
            catalogNode.setAttribute('data-mounted', 'true');
            const studioKey = catalogNode.getAttribute("data-studio-key");
            window.ReactDOM.createRoot(catalogNode).render(e(JubileeCatalogApp, { studioKey, config }));
        }

        // 2. Mount Direct Player
        const playerNode = document.getElementById("jubilee-bloom-root");
        if (playerNode && !catalogNode && !playerNode.hasAttribute('data-mounted')) {
             playerNode.setAttribute('data-mounted', 'true');
             const assetId = playerNode.getAttribute("data-asset");
             const studioKey = playerNode.getAttribute("data-studio-key");
             
             // We can pass a prop to force reader or media based on shortcode, assuming media for now
             window.ReactDOM.createRoot(playerNode).render(e(JubileePlayerApp, { assetId, studioKey, config, onClose: () => playerNode.innerHTML = 'Closed.' }));
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootKobaSystems);
    } else {
        bootKobaSystems();
    }
})();