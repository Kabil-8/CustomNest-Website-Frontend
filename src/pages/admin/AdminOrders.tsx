import React, { useEffect, useState } from 'react';
import { Search, Eye, Loader2, PackageX, Truck, Calendar, Check, Save, Trash2, Camera, Palette, Download, ExternalLink, ZoomIn, X, Image as ImageIcon } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';
import type { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { OrderTimeline } from '../../components/OrderTimeline';
import { formatDate, estimateDelivery, getHandcraftingWindow, getImageUrl, downloadImage } from '../../lib/utils';

export default function AdminOrders() {
  const { show } = useToast();
  const [orders, setOrders]             = useState<Order[]>([]);
  const [loading, setLoading]           = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string; filename: string } | null>(null);
  const [downloadingImg, setDownloadingImg] = useState<string | null>(null);

  // Delivery update form in modal
  const [modalStatus, setModalStatus] = useState<OrderStatus>('Pending');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [courier, setCourier] = useState<string>('');
  const [tracking, setTracking] = useState<string>('');

  const handleDownload = async (url: string, filename: string, key?: string) => {
    if (key) setDownloadingImg(key);
    try {
      await downloadImage(url, filename);
      show(`Download started: ${filename} ✓`, 'success');
    } catch {
      show('Failed to download image', 'error');
    } finally {
      if (key) setDownloadingImg(null);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await ordersApi.listAll();
      setOrders(list);
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderModal = (o: Order) => {
    setSelectedOrder(o);
    setModalStatus(o.status);
    setDeliveryDate(o.estimatedDeliveryDate || estimateDelivery(o.shippedAt || new Date().toISOString(), 3));
    setCourier(o.courierPartner || '');
    setTracking(o.trackingNumber || '');
  };

  const handleDeleteOrder = async (e: React.MouseEvent, orderId: string, orderNumber?: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete order ${orderNumber || orderId.slice(-8)}?`)) {
      return;
    }
    setDeletingId(orderId);
    try {
      await ordersApi.remove(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      show(`Order ${orderNumber || orderId.slice(-8)} permanently deleted ✓`, 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to delete order', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const defaultDelivery = targetOrder?.estimatedDeliveryDate || estimateDelivery(new Date().toISOString(), 3);
      
      const updated = await ordersApi.updateStatus(orderId, nextStatus, {
        estimatedDeliveryDate: nextStatus === 'Shipped' ? defaultDelivery : undefined,
      });

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
        setModalStatus(updated.status);
      }
      show(`Updated ${orderId.slice(-8)} status to ${nextStatus.toUpperCase()}! 📦`, 'success');
      
      // If changed to Shipped, open modal so admin can review and confirm courier/delivery date
      if (nextStatus === 'Shipped') {
        openOrderModal(updated);
      }
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to update order status', 'error');
    }
  };

  const handleSaveShippingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingDetails(true);
    try {
      const updated = await ordersApi.updateStatus(selectedOrder.id, modalStatus, {
        estimatedDeliveryDate: deliveryDate.trim() || undefined,
        courierPartner: courier.trim(),
        trackingNumber: tracking.trim(),
      });

      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      show(`Shipping and delivery details saved for #${selectedOrder.id.slice(-8)} ✓`, 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to save shipping details', 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'all' && o.status !== selectedStatus) return false;
    if (
      searchQuery.trim() &&
      !o.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(o.address?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="eyebrow mb-1">Fulfillment & Shipping</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Customer Orders ({loading ? '…' : orders.length})
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Customer Name..."
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-line bg-white text-charcoal outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted gap-2">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-xs font-semibold">Loading orders from database…</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <PackageX size={32} />
          </div>
          <h3 className="font-display text-xl text-charcoal mb-2">No orders found</h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            When customers place orders, they will appear here live with fulfillment status and delivery tracking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream/40 text-muted uppercase text-[0.65rem] tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Fulfillment / Delivery</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-charcoal font-mono">
                      <div>
                        <span>{o.orderNumber ?? o.id.slice(-10)}</span>
                        {o.customerNotes && (
                          <span
                            title={`Customization Note: ${o.customerNotes}`}
                            className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full mt-1 block w-fit"
                          >
                            🎨 Custom Note
                          </span>
                        )}
                        {o.paymentScreenshot ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModalImg({
                                  url: getImageUrl(o.paymentScreenshot),
                                  title: `Payment Screenshot Proof (${o.orderNumber || o.id})`,
                                  filename: `payment_proof_${o.orderNumber || o.id.slice(-6)}.jpg`,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-full transition cursor-pointer"
                              title="Click to view & zoom screenshot"
                            >
                              <Camera size={11} /> View Proof
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(getImageUrl(o.paymentScreenshot), `payment_proof_${o.orderNumber || o.id.slice(-6)}.jpg`);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer shadow-2xs"
                              title="Download payment screenshot"
                            >
                              <Download size={10} />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1 block w-fit">
                            ⏳ Pending Payment SS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-charcoal block">
                        {o.address?.fullName || o.customerName || 'Customer'}
                      </span>
                      <span className="text-[0.65rem] text-muted block">
                        {o.address?.phone || 'No phone'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      {o.status === 'Shipped' ? (
                        <div>
                          <span className="text-emerald-700 font-bold block text-[0.68rem]">
                            🚚 Delivering by {o.estimatedDeliveryDate || '3–4 days'}
                          </span>
                          {o.courierPartner && (
                            <span className="text-muted text-[0.62rem] block">{o.courierPartner}</span>
                          )}
                        </div>
                      ) : o.status === 'Delivered' ? (
                        <span className="text-emerald-600 font-semibold text-[0.68rem]">✓ Completed</span>
                      ) : (
                        <span className="text-rose-600 font-semibold text-[0.65rem] block">
                          🧶 Prep: 7–10 days ({getHandcraftingWindow(o.createdAt).rangeText})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">₹{o.total}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold border border-line bg-white cursor-pointer outline-none focus:border-rose-400"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openOrderModal(o)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteOrder(e, o.id, o.orderNumber)}
                          disabled={deletingId === o.id}
                          title="Delete Order"
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer shrink-0"
                        >
                          {deletingId === o.id ? <Loader2 size={12} className="animate-spin text-rose-500" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail & Shipping Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[95] bg-charcoal/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-lift border border-line p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="eyebrow text-xs">Order Management</span>
                <h2 className="font-display text-xl text-charcoal font-mono">
                  {selectedOrder.orderNumber || selectedOrder.id}
                </h2>
                <p className="text-xs text-muted mt-0.5">Placed on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-charcoal hover:bg-rose-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Product Expectation & Color Customization Notes */}
            {selectedOrder.customerNotes && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <Palette size={15} className="text-amber-700" />
                    <span>Customer Product Expectation & Color Choices</span>
                  </div>
                  <span className="text-[0.62rem] font-bold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full">
                    Customer Note
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-charcoal font-medium leading-relaxed whitespace-pre-wrap shadow-2xs">
                  {selectedOrder.customerNotes}
                </div>
              </div>
            )}

            {/* UPI Payment Screenshot Verification */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <Camera size={15} />
                  <span>UPI Payment Screenshot</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold ${
                  selectedOrder.paymentScreenshot ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {selectedOrder.paymentScreenshot ? 'Screenshot Uploaded' : 'Awaiting Screenshot'}
                </span>
              </div>

              {selectedOrder.paymentScreenshot ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
                  <div
                    onClick={() => {
                      const url = getImageUrl(selectedOrder.paymentScreenshot);
                      setPreviewModalImg({
                        url,
                        title: `Payment Screenshot Proof (${selectedOrder.orderNumber || selectedOrder.id})`,
                        filename: `payment_proof_${selectedOrder.orderNumber || selectedOrder.id.slice(-6)}.jpg`,
                      });
                    }}
                    className="relative group shrink-0 block cursor-pointer"
                    title="Click to zoom screenshot"
                  >
                    <img
                      src={getImageUrl(selectedOrder.paymentScreenshot)}
                      alt="Payment Screenshot Proof"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-rose-200 shadow-xs group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-[10px] font-semibold transition">
                      Zoom ↗
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-charcoal">Customer Payment Proof</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                      Amount charged: <strong className="text-rose-600">₹{selectedOrder.total}</strong>. Verify UPI transaction proof before shipping.
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const url = getImageUrl(selectedOrder.paymentScreenshot);
                          handleDownload(url, `payment_proof_${selectedOrder.orderNumber || selectedOrder.id.slice(-6)}.jpg`, 'payment-proof');
                        }}
                        disabled={downloadingImg === 'payment-proof'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        {downloadingImg === 'payment-proof' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        <span>Download Screenshot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = getImageUrl(selectedOrder.paymentScreenshot);
                          setPreviewModalImg({
                            url,
                            title: `Payment Screenshot Proof (${selectedOrder.orderNumber || selectedOrder.id})`,
                            filename: `payment_proof_${selectedOrder.orderNumber || selectedOrder.id.slice(-6)}.jpg`,
                          });
                        }}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 rounded-xl border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <ZoomIn size={12} />
                        <span>Enlarge</span>
                      </button>
                      <a
                        href={getImageUrl(selectedOrder.paymentScreenshot)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-rose-600 font-medium hover:underline"
                      >
                        <ExternalLink size={11} />
                        <span>New tab</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic">No payment screenshot attached for this order yet.</p>
              )}
            </div>

            {/* Customer Uploaded Custom Reference Images (if order is linked to custom order request) */}
            {(() => {
              const customReq = (selectedOrder as any).customOrderId;
              if (!customReq) return null;
              const refImages: string[] = Array.isArray(customReq.referenceImages) && customReq.referenceImages.length > 0
                ? customReq.referenceImages
                : (customReq.referenceImage ? [customReq.referenceImage] : []);
              const sampleImg = customReq.sampleImage;
              if (refImages.length === 0 && !sampleImg) return null;

              return (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-200/60">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-rose-600" />
                      <span className="text-xs font-bold text-charcoal">Customer Reference Photos (Custom Order)</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                        {refImages.length} Photo{refImages.length !== 1 ? 's' : ''}{sampleImg ? ' + 1 Sample' : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const orderNum = selectedOrder.orderNumber || selectedOrder.id.slice(-6);
                        for (let i = 0; i < refImages.length; i++) {
                          await downloadImage(getImageUrl(refImages[i]), `${orderNum}_reference_photo_${i + 1}.jpg`);
                        }
                        if (sampleImg) {
                          await downloadImage(getImageUrl(sampleImg), `${orderNum}_sample_inspiration.jpg`);
                        }
                        show('Started downloading all photos ✓', 'success');
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <Download size={12} />
                      Download All Images
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {refImages.map((imgPath: string, idx: number) => {
                      const url = getImageUrl(imgPath);
                      const title = `📸 Customer Photo Document ${idx + 1}`;
                      const filename = `${selectedOrder.orderNumber || 'order'}_photo_${idx + 1}.jpg`;
                      return (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between space-y-1.5">
                          <p className="text-[10px] font-bold text-charcoal truncate">📸 Photo {idx + 1}</p>
                          <div
                            onClick={() => setPreviewModalImg({ url, title, filename })}
                            className="aspect-square w-full rounded-lg overflow-hidden bg-sand relative group cursor-pointer border border-rose-200/50"
                          >
                            <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                              Zoom ↗
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownload(url, filename, `custom-ref-${idx}`)}
                            className="w-full py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Download size={10} />
                            Download
                          </button>
                        </div>
                      );
                    })}

                    {sampleImg && (
                      <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between space-y-1.5">
                        <p className="text-[10px] font-bold text-charcoal truncate">🖼️ Sample Inspiration</p>
                        <div
                          onClick={() => setPreviewModalImg({ url: getImageUrl(sampleImg), title: 'Sample Inspiration Reference', filename: `${selectedOrder.orderNumber || 'order'}_sample.jpg` })}
                          className="aspect-square w-full rounded-lg overflow-hidden bg-sand relative group cursor-pointer border border-rose-200/50"
                        >
                          <img src={getImageUrl(sampleImg)} alt="Sample" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                            Zoom ↗
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(getImageUrl(sampleImg), `${selectedOrder.orderNumber || 'order'}_sample.jpg`, 'custom-sample')}
                          className="w-full py-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Download size={10} />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Interactive Timeline */}
            <div>
              <span className="label text-[0.7rem] mb-2 block">Fulfillment Timeline</span>
              <OrderTimeline currentStatus={selectedOrder.status} />
            </div>

            {/* ── Shipping & Delivery Update Section ────────────────────── */}
            <form onSubmit={handleSaveShippingDetails} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Truck size={15} />
                <span>Delivery & Tracking Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-[0.68rem] text-charcoal mb-1">
                    Order Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                    className="input text-xs py-2 bg-white"
                  >
                    <option value="Pending">Pending (7–10 days preparation)</option>
                    <option value="Confirmed">Confirmed (7–10 days preparation)</option>
                    <option value="Processing">Processing (7–10 days preparation)</option>
                    <option value="Shipped">Shipped (On the way)</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="label text-[0.68rem] text-charcoal mb-1">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="e.g. 10 Sep 2026 or 3–4 days"
                    className="input text-xs py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="label text-[0.68rem] text-charcoal mb-1">
                    Courier Partner (optional)
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. Delhivery / DTDC / BlueDart"
                    className="input text-xs py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="label text-[0.68rem] text-charcoal mb-1">
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="e.g. TRK987654321"
                    className="input text-xs py-2 bg-white"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-[0.65rem] text-muted">
                  Updating this saves delivery & tracking information and alerts the customer.
                </p>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-soft"
                >
                  {savingDetails ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{savingDetails ? 'Saving…' : 'Save Details'}</span>
                </button>
              </div>
            </form>

            {/* Customer Info */}
            <div className="p-4 rounded-2xl bg-cream/40 border border-line space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Customer:</span>
                <span className="font-bold text-charcoal">{selectedOrder.address?.fullName || selectedOrder.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone:</span>
                <span className="font-bold text-charcoal">{selectedOrder.address?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping Address:</span>
                <span className="font-bold text-charcoal text-right max-w-xs">
                  {selectedOrder.address
                    ? `${selectedOrder.address.line1}, ${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.postalCode}`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <span className="label text-[0.7rem] mb-2 block">
                Order Items ({selectedOrder.items?.length || 0})
              </span>
              <div className="space-y-3 divide-y divide-line/60">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="pt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          onClick={() => {
                            const url = getImageUrl(item.image || '/images/products/amigurumi-bunny.jpg');
                            setPreviewModalImg({
                              url,
                              title: item.name || 'Order Item Image',
                              filename: `${item.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'item'}.jpg`,
                            });
                          }}
                          className="relative group shrink-0 block cursor-pointer"
                          title="Click to view full image"
                        >
                          <img
                            src={getImageUrl(item.image || '/images/products/amigurumi-bunny.jpg')}
                            alt={item.name || 'Product'}
                            className="w-14 h-14 rounded-xl object-cover border border-rose-200 bg-ivory shadow-xs group-hover:scale-105 transition"
                          />
                          {selectedOrder.isCustomOrder && (
                            <span className="absolute -bottom-1.5 -right-1.5 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                              Sample
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = getImageUrl(item.image || '/images/products/amigurumi-bunny.jpg');
                            handleDownload(url, `${item.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'item'}.jpg`, `item-${idx}`);
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 mt-0.5 cursor-pointer"
                          title="Download item photo"
                        >
                          <Download size={9} /> Download
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-charcoal">{item.name || 'Product'}</p>
                          {selectedOrder.isCustomOrder && (
                            <span className="bg-rose-100 text-rose-700 text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
                              Custom Crafted
                            </span>
                          )}
                        </div>
                        <p className="text-[0.65rem] text-muted mt-0.5">Qty: {item.quantity}</p>
                        {item.customization && (
                          <div className="mt-1 space-y-1">
                            <p className="text-[0.65rem] text-rose-600 font-semibold">
                              {[
                                item.customization.resinOption ? `Resin Setup: ${item.customization.resinOption}` : null,
                                item.customization.yarnType ? (item.customization.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn') : null,
                                item.customization.size ? `Size: ${item.customization.size}` : null,
                                item.customization.personalization ? `Name: ${item.customization.personalization}` : null,
                              ].filter(Boolean).join(' · ')}
                            </p>
                            {item.customization.color && (
                              <div className="text-[0.7rem] bg-rose-50 border border-rose-200/90 rounded-lg px-2.5 py-1 text-charcoal">
                                <span className="font-bold text-rose-800">🎨 Colour Preference: </span>
                                <span className="font-semibold text-rose-950">{item.customization.color}</span>
                              </div>
                            )}
                            {item.customization.specialRequest && (
                              <p className="text-[0.65rem] text-charcoal/80 bg-rose-50/50 p-1.5 rounded-lg border border-rose-100/60 leading-relaxed">
                                <span className="font-semibold text-muted">Vision/Details:</span> {item.customization.specialRequest}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-xs font-bold text-rose-600">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between">
              <div>
                <span className="font-display text-base block">Total Order Value</span>
                <span className="text-xs text-muted">Includes ₹{selectedOrder.shipping || 50} shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl text-rose-600">₹{selectedOrder.total}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteOrder(e, selectedOrder.id, selectedOrder.orderNumber)}
                  disabled={deletingId === selectedOrder.id}
                  className="btn-tertiary text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom / Full Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-[100] bg-charcoal/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="min-w-0 pr-4">
                <h3 className="font-display text-base text-charcoal truncate">{previewModalImg.title}</h3>
                <p className="text-[11px] text-muted truncate">{previewModalImg.filename}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(previewModalImg.url, previewModalImg.filename)}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <a
                  href={previewModalImg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1"
                  title="Open full image in new browser tab"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="w-8 h-8 rounded-full bg-sand hover:bg-rose-100 flex items-center justify-center text-charcoal transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-sand/30 flex items-center justify-center p-2 min-h-[300px] max-h-[65vh]">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
