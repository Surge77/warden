// Labeled OCR fixture set. Each `raw` is text as ML Kit would emit it; `expected`
// is the ground truth we score the parser against. This drives the headline
// amount-extraction accuracy metric (see receipt-parser.test.ts).

export interface ReceiptFixture {
  name: string;
  raw: string;
  expected: {
    amountMinor: number | null;
    date: string | null;
    merchant: string | null;
  };
}

export const RECEIPT_FIXTURES: ReceiptFixture[] = [
  {
    name: 'swiggy food order',
    raw: 'Swiggy\nOrder #1234\nItem total 420.00\nDelivery 30.00\nGrand Total ₹450.00\n12/05/2024',
    expected: { amountMinor: 45000, date: '2024-05-12', merchant: 'Swiggy' },
  },
  {
    name: 'dmart groceries',
    raw: 'DMart\nReliance Retail\nMilk 56.00\nBread 40.00\nTotal Amount 96.00\nDate: 03/06/2024',
    expected: { amountMinor: 9600, date: '2024-06-03', merchant: 'DMart' },
  },
  {
    name: 'big bazaar with rupee symbol',
    raw: 'Big Bazaar\nGSTIN 27ABCDE\nSubtotal ₹1,200.00\nTotal ₹1,249.50\n15-04-2024',
    expected: { amountMinor: 124950, date: '2024-04-15', merchant: 'Big Bazaar' },
  },
  {
    name: 'cafe coffee day',
    raw: 'Cafe Coffee Day\nCappuccino 180\nTotal: Rs.180.00\n01.02.2024',
    expected: { amountMinor: 18000, date: '2024-02-01', merchant: 'Cafe Coffee Day' },
  },
  {
    name: 'apollo pharmacy',
    raw: 'Apollo Pharmacy\nInvoice No 9981\nNet Amount 345.50\n22/11/2023',
    expected: { amountMinor: 34550, date: '2023-11-22', merchant: 'Apollo Pharmacy' },
  },
  {
    name: 'uber ride',
    raw: 'Uber\nTrip fare 210.00\nTotal ₹210.00\nDate 2024-07-09',
    expected: { amountMinor: 21000, date: '2024-07-09', merchant: 'Uber' },
  },
  {
    name: 'amazon delivery',
    raw: 'Amazon\nOrder summary\nGrand Total Rs. 2,499.00\n05 Jan 2024',
    expected: { amountMinor: 249900, date: '2024-01-05', merchant: 'Amazon' },
  },
  {
    name: 'restaurant no keyword fallback',
    raw: 'Paradise Biryani\nChicken Biryani 320.00\nWater 20.00\n340.00\n18/03/2024',
    expected: { amountMinor: 34000, date: '2024-03-18', merchant: 'Paradise Biryani' },
  },
  {
    name: 'mobile recharge bill',
    raw: 'Jio Recharge\nPlan 299\nAmount Payable ₹299.00\n10/10/2024',
    expected: { amountMinor: 29900, date: '2024-10-10', merchant: 'Jio Recharge' },
  },
  {
    name: 'pvr cinema',
    raw: 'PVR Cinemas\nTicket x2\nBalance 600.00\n28-09-2024',
    expected: { amountMinor: 60000, date: '2024-09-28', merchant: 'PVR Cinemas' },
  },
  {
    name: 'petrol pump',
    raw: 'Indian Oil\nPetrol\nTotal Amount: 1000.00\n14/08/2024',
    expected: { amountMinor: 100000, date: '2024-08-14', merchant: 'Indian Oil' },
  },
  {
    name: 'myntra shopping',
    raw: 'Myntra\nT-Shirt 799.00\nDiscount -100.00\nGrand Total 699.00\n2024-12-01',
    expected: { amountMinor: 69900, date: '2024-12-01', merchant: 'Myntra' },
  },
  {
    name: 'zomato order with gst + timestamp',
    raw: 'Zomato\nOrder ID 8842910\nBurger 199.00\nFries 99.00\nItem Total 298.00\nGST 14.90\nDelivery Fee 35.00\nGrand Total ₹347.90\n08/03/2024 21:14',
    expected: { amountMinor: 34790, date: '2024-03-08', merchant: 'Zomato' },
  },
  {
    name: 'bigbasket groceries total payable',
    raw: 'BigBasket\nbigbasket.com\nTomato 1kg 40.00\nRice 5kg 350.00\nAtta 245.00\nGST 18% 32.00\nTotal Payable Rs.667.00\n19/02/2024',
    expected: { amountMinor: 66700, date: '2024-02-19', merchant: 'BigBasket' },
  },
  {
    name: 'hp petrol pump',
    raw: 'HP Petrol Pump\nGSTIN 29AABCH1234\nProduct: Petrol\nRate 102.50\nVolume 9.75 L\nAmount Payable ₹999.38\n07/06/2024',
    expected: { amountMinor: 99938, date: '2024-06-07', merchant: 'HP Petrol Pump' },
  },
  {
    name: 'medplus pharmacy net payable',
    raw: 'MedPlus Pharmacy\nBill No 55231\nParacetamol 28.00\nVitamin C 145.00\nNet Payable 173.00\n14-01-2024',
    expected: { amountMinor: 17300, date: '2024-01-14', merchant: 'MedPlus Pharmacy' },
  },
  {
    name: 'gpay upi transfer',
    raw: 'Google Pay\nPaid to Sharma Kirana Store\nUPI Ref 412345678901\nRs.540\n23/04/2024',
    expected: { amountMinor: 54000, date: '2024-04-23', merchant: 'Google Pay' },
  },
  {
    name: 'phonepe payment',
    raw: 'PhonePe\nTransaction Successful\n₹1,250\nPaid to Verma Electronics\nUTR 998877665544\n11/07/2024',
    expected: { amountMinor: 125000, date: '2024-07-11', merchant: 'PhonePe' },
  },
  {
    name: 'dominos pizza cgst sgst',
    raw: "Domino's Pizza\nStore #1123\nMargherita 269.00\nPepsi 60.00\nCGST 8.23\nSGST 8.23\nGrand Total 345.46\n2024-05-20",
    expected: { amountMinor: 34546, date: '2024-05-20', merchant: "Domino's Pizza" },
  },
  {
    name: 'tiffin centre no keyword fallback',
    raw: 'Saravana Bhavan\nMasala Dosa 120.00\nFilter Coffee 40.00\nIdli 50.00\n210.00\nThank you visit again\n16/09/2024',
    expected: { amountMinor: 21000, date: '2024-09-16', merchant: 'Saravana Bhavan' },
  },
  {
    name: 'reliance digital with hsn line',
    raw: 'Reliance Digital\nTax Invoice\nUSB Cable 499.00\nHSN 8544 GST 89.82\nTotal Amount ₹588.82\n02-12-2024',
    expected: { amountMinor: 58882, date: '2024-12-02', merchant: 'Reliance Digital' },
  },
  {
    name: 'flipkart order',
    raw: 'Flipkart\nSeller: RetailNet\nWireless Mouse 649.00\nShipping 0.00\nGrand Total Rs. 649.00\n5 Mar 2024',
    expected: { amountMinor: 64900, date: '2024-03-05', merchant: 'Flipkart' },
  },
  {
    name: 'ola cab ride',
    raw: 'Ola Cabs\nRide Receipt\nBase Fare 50.00\nDistance 12.4 km\nRide Charge 248.00\nTotal ₹298.00\n27/10/2024',
    expected: { amountMinor: 29800, date: '2024-10-27', merchant: 'Ola Cabs' },
  },
  {
    name: 'kfc restaurant subtotal then total',
    raw: 'KFC\nBucket Meal 499.00\nColdrink 80.00\nCGST 14.48\nSGST 14.48\nSubtotal 579.00\nTotal Amount 607.96\n13/08/2024',
    expected: { amountMinor: 60796, date: '2024-08-13', merchant: 'KFC' },
  },
  {
    name: 'starbucks cafe rs total',
    raw: 'Starbucks Coffee\nLatte 320\nMuffin 180\nTotal: Rs.500.00\n30.11.2024',
    expected: { amountMinor: 50000, date: '2024-11-30', merchant: 'Starbucks Coffee' },
  },
  {
    name: 'dmart balance due with mrp noise',
    raw: 'DMart\nAvenue Supermarts\nShampoo MRP 199.00 You Pay 149.00\nSoap 45.00\nBalance Due 194.00\n09/05/2024',
    expected: { amountMinor: 19400, date: '2024-05-09', merchant: 'DMart' },
  },
];
