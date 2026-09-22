## all users

1. login

- user masukkan email
- sistem cek apakah email terdaftar dan apakah aktif/tidak aktif
- sistem menyimpan log (info detail ada yang mencoba login, berhasil atau gagal dan detail lainnya)
- sistem mengirim kode otp ke email yang diinput user tadi
- sistem menghitung berapa kali percobaan mengirim kode otp (harus ada maksimal)
- kode otp diinput oleh user
- sistem cek apakah kode otp benar
- sistem menyimpan log hasil submit otp user (apakah berhasil atau tidak dan detail lainnya)
- sistem membuat token untuk dikirim ke user sebagai tanda login
- user berhasil login
- sistem menyimpan log juga berhasil login, siapa kapan dan lain lain

2. logout

- user klik tombol logout
- sistem menghapus token
- sistem menyimpan log user logout dan detailnya
- user diredirect ke halaman login

## admin

1. melihat ringkasan

- membuka halaman dashboard
- sistem mengambil data total produk, assigned ke dealer, garansi aktif, garansi berakhir, waiting list.
- sistem menampilkan data

2. melihat log

- user membuka halaman dashboard
- sistem mengambil data log
- user melihat log

3. filter log

- user dapat mencari log, filter log berdasarkan kategori, filter log berdasarkan berhasil/error, filter berdasarkan prioritas, filter berdasarkan waktu

4. melihat detail log

- user dapat melihat detail dari setiap log jika log diklik, detail dari log adalah (id, kategori, date and time, prioritas, dari user mana, dan detail dalam objek bernama "Data" yang itu merupakan tergantuk dari kategori log).

5. user dapat melihat semua produk

- user membuka halaman produk
- sistem mengambil data produk dari database
- sistem menampilkan tabel list produk

6. user dapat melihat detail produk

- user klik detail salah satu produk
- sistem menampilkan detail produk (sn, tipe, kategori, nama dealer(jika di assign ke dealer), nama customer (jika terjual), status, mulai garansi (jika sudah terjual), berakhir gransi, id invoice(jika sudah terjual))

7. user dapat mengubah status valid atau tidak validnya garansi produk (jika sudah aktif)

8. user dapat assign produk ke dealer

- user klik assign ke dealer
- user memilih dealer
- user memilih produk
- user klik assign
- sistem menyimpan log (log berhasil atau gagal dan detailnya)

9. user dapat meregistrasikan garansi (jika produk memang terjual langsung dari sales kassen ke end customer langsung, tidak melalui dealer)

- user klik tombol registrasi garansi
- user memilih produk yang belum dregistrasikan
- user klik tombol registrasi
- user mengisi form detail dari customer dan invoice (pilih customer yang sudah pernah beli atau input data customer baru)
- sistem menyimpan log dan detailnya

10. user dapat memfilter list produk berdasarkan status, dealer, dan kategori

11. user dapat melihat list semua user (nama, email, role, status, date created, login terakhir)

12. user dapat melihat ringkasan semua user (total, aktif, nonaktif, role terdaftar)

13. user dapat filter list user berdasarkan role dan status

14. user dapat menonaktifkan user

- user klik tombol nonaktifkan
- sistem menampilkan popup konfirmasi
- user klik nonaktifkan
- sistem merubah status aktif user menjadi nonaktif
- sistem mengirim email pemberitahuan perubahan status ke email tujuan
- sistem menyimpan log

15. user dapat menghapus akun

- user klik icon hapus salah satu user
- sistem menampilkan popup konfirmasi
- user klik hapus
- sistem menghapus user yang dipilih dari database (atau soft delete)
- sistem menyimpan log

16. user dapat menambahkan user baru

- user menambahkan user dengan mengisi form
- sistem konfirmasi email yang diisi dengan mengirimkan kode konfirmasi
- user memasukkan kode konfirmasi
- sistem menambahkan user
- sistem menyimpan log

17. user dapat melihat list dealer

18. user dapat melihat detail dealer yang ingin dilihat (nama/perusahaan dealer, email, no hp, alamat, id, total produk yang di assign, total produk yang terjual, total pembelian (invoice) dengan id pembeliannya (Agar bisa tersambung gitu dengan data pembelian), tanggal bergabung, status (aktif atau tidak aktif))

19. user dapat menonaktifkan dealer

- user menonaktifkan
- sistem mengubah status menjadi tidak aktif
- sistem menyimpan log

20. user dapat mencari delaer berdasarkan nama atau email dealer

- user dapat menambahkan dealer baru
  - log

21. user dapat melihat total produk terjual dari dealer bersebut dan juga total pembelian (total produk terjual dan nyambung ke invoice id jgua)

22. user dapat mengedit detail info dari dealer tersebut

23. user dapat melihat list semua data pembelian

- list data pembelian adalah setiap 1 invoice 1 data pembelian

24. user dapat memfilter data list pembelian

- berdasarkan search input (nama customer/dealer/sn)
- berdasarkan tanggal (range)

25. user dapat mlihat detail dari daat pembelian

- id, date, (id data customer karna data customer mending dibedakan aja nant ibuat list baru untuk data customer), data produk yang dibeli (list nya). periode garansi, file invoice

26. user dapat edit data pembelian

- edit setelah edit maka ada log, untuk edit detail customer maka akan membuka popup/ modal baru utnuk edit data customer

27. user dapat melihat daftar list customer

28. user dapat melihat detail customer (nama, email, no telpon, alamat, list pembelian (ini tersambung ke list data pembelian tadi yang per invoice sebelumnya itu))

29. user dapat mengupload file excel yang berasal dari accurate untuk mendaftarkan produk baru.

- file yang diupload merupakan file delivery orderh
- dalam file tersebut ada detail nama customer dikirim dari siapa, tanggal, item code, item description, quantity, dan juga semua S/N produk yang dikirim/dibeli
- karna pada kolom "nama customer" bisa jadi dealer atau langsung customer, maka setelah upload akan muncul window modal untuk "preview" apakah datanya sudah benar semua atau belum seperti memilih apakah itu data dikirim ke dealer atau alngsung customer, kalau langsung customer berarti dia otomatis merupakan pembelian, jadi kalau customer maka ada disuruh upload invoice, dan detail pembelian lainnya. kalau emrupakan dealer maka pilih dealer yang sudah terdaftar atau input baru, kalau input baru maka input detail dealer dulu baru bisa submit, dan kalau memang dealer setalh submit maka otomatis produk2 tersebut sudah di assign ke dealer tersebut, DAN otomatis mendaftarkan user baru yaitu user dealer tersebut.

30. user dapat melihat list waiting list

- jadi nanti di user "dealer" misal sudah punya pelanggan tapi serial number atau produk belum terdaftar di sistem, maka dealer bisa request produk (akan dijelaskan di requirement user dealer lebih detail)
- atau user "end user" jika ingin melihat status garansi dari produknya tapi serial number yang diinput tidak ditemukan maka akan masuk ke waiting list ini.

31. user dapat mengirimkan notifikasi ke requester dari waiting list

- user dapat mengirimkan notifikas ke requester seesuai dengan apakah produk sudah didaftarkan. atau kirim saja seperti "cek lagi apakah serial number sudah benar atau belum". notifikasi untuk dealer tidak perlu dikirim email, notifikasi yang dikirim melalui email hanya berlaku jika requester merupakan "end user".

## sales

SAMA SEPERTI ADMIN TAPI MINUS SEMUA YANG BERHBUUNGAN DENGAN MANAJEMEN USER

## dealer

1. user dapat melihat halaman dashboard

- terdapat list notifikasi notifikasi
- terdapat tabel list produk yang sudah di assign ke user oleh sales atau admin
- notifikasi merupakan notifikasi seperti jika user (dealer) request produk untuk diupdate jika sserial number dari produk yang sudah datang di dealer itu belum ada pada database

2. user dapat meregistraiskan garansi pada halaman "registrasikan garansi"

- user memilih produk2 yang ingin di registrasikan garansiny
- lalu next step, yaitu mengisikan detail customer dan juga invoice pembelian, untuk detail customer itu disuruh cari dulu apakah terdapat customernya dealer tersebut yang sudah pernah beli disitu, jadi tinggal pilih tanpa membuat user baru supaya tidak ada duplikasi nama customer. kalau memang tidak ada maka klik buat data customer baru ayng mmemunculkan form data customer yang harus diisi. lalu submit data registrasi garansi

3. user dapat melihat list pembelian (seperti di admin dan sales berdasarkan invoice).

4. user dapat edit detail pembelian tersebut seperti pada admin dan sales

- sama seperti sales dan admin saat edit data pembelian maka saat edit user akan muncul popup baru yaitu edit user karna data ini berbeda. btw berarti data customer sebenarnya juga nyambung, customer ini beli dari dealer mana saja (mungkin bisa lebih dari 1?) gitu sih
- log setelah submit

5. user dapat request produk/sn yang belum diassign ke user dealer tersebut

- jangan luipa log juga

## tech support

- user dapat melihat tabel list semua produk
- user dapat memfilter / mencari list produk berdasarkan input search / kategori / kondisi (kondisi garnsi valid atau tidak valid)
- user dapat mengubah stauts garansi dari valid ke tidak valid atau sebaliknya dengan mengisi form alasannya jika tidak valid
- menyimpan log juga

Seputar Upload Accurate & Produk

1. Di requirement no. 29, file dari Accurate itu adalah Delivery Order — artinya produk sudah dikirim ke customer/dealer. Tapi di flow lain ada proses "upload dulu, assign ke dealer belakangan". Pertanyaannya: apakah memang ada 2 sumber produk masuk ke sistem?
   a. Sumber A: Upload DO dari Accurate (produk langsung ter-assign ke dealer atau customer)
   b. Sumber B: Produk diinput manual dulu, baru di-assign belakangan
   Atau semua produk masuk hanya lewat upload Accurate?
   > jawaban: ini belum aku tanyakan ke klien sih, sudah malam soalnya tapi produk hanya ditambahkan sepertinya hanya dari file excel yang dari accurate itu, dan filenya pasti merupakan DO, jadi harusnya semua dari file DO itu tapi emang bedanya apa? aku ingin tahu
2. Satu file DO dari Accurate — apakah bisa berisi campuran (sebagian ke dealer, sebagian langsung ke customer)? Atau satu file DO pasti hanya ke satu tujuan?
   > jawaban: 1 file itu hanya 1 nama customer/dealer saja (satu tujuan). jadi ini bisa upload lebih dari 1 file, aku baru kepikiran, berarti saat upload file itu akan ditanyain setiap file yang diupload (muncul modal lagi sebelum konfirmasi upload) tentang detailnya jadi kayak form step gitu konsepnya tapi ini tentang file 1 lalu next itu ke file selanjutnya dan selanjutnya sampai selesai, ini ditanyain pertama sesuai requirement itu yaitu pilih apakah file ini end customer atau dealer, dan selanjutnya ya sesuai dengan requiremtn itu kalau customer maka harusnya itu harus upload invoice, pilih customer/bikin data cusomer baru dan membuat data pembelian baru (disitu juga), kalau dealer ya pilih nama dealer, kalau gaada maka pilih bikin baru dan lain lain.
3. Quantity di DO — apakah satu baris bisa quantity > 1 dengan banyak SN sekaligus? Atau selalu 1 baris = 1 SN?
   > jawaban: jadi nanti begini isinya file excel ada item code (semacam kategori), lalu ada item description (seperti tipe produk misal XA-02), baru sn yaitu misal berapa unit dari tipe produk tersebut dan setiap unit memiliki sn sendiri yang unik

Seputar Customer & Dealer

4. Customer bisa beli dari lebih dari 1 dealer — kamu bilang "mungkin bisa lebih dari 1?". Ini perlu dipastikan karena mempengaruhi struktur database. Apakah 1 customer bisa punya riwayat pembelian di dealer A dan dealer B sekaligus?
   > jawaban: bisa jadi, ini mungkin saja kan?
5. Saat dealer registrasi garansi dan input customer baru — apakah customer tersebut bisa dilihat oleh dealer lain? Atau data customer itu "milik" dealer yang input?
   > jawaban: jujur ini aku bingung karna aku melihat kebiungungan yaitu kalaumisal semua data customer bisa dilihat oleh semua dealer maka tidak akan aman dong? kalau misal hanya dealer tersebut nanti bisa duplikat datanya, enaknya gimana ya??
6. Dealer dibuatkan akun otomatis saat upload DO (requirement 29). Akun ini pakai email siapa? Email yang ada di data dealer di DO? Apakah di file DO memang ada kolom email dealer?
   > jawaban: di file DO tidak ada email sih hanya nama, makanya mungkin saat upload file 1 atau lebih maka saat di modal cek lagi itu harus memasukkan atleast email pada setiap dealer (jika itu memang dealer di DO nya)

Seputar Waiting List

7. End user yang masuk waiting list — mereka input data diri (nama, email, no HP) saat request? Atau waiting list hanya menyimpan SN yang dicari saja?
   > jawaban: oh iya yaallah maaf aku lupa menuliskan kebutuhan/requiremen user "end user" yaitu memansukkan sn kan, nah kalau misal tidak ditemukan maka akan muncul form mengisi detail nama, email, no hp, dan sn tadi yang ingin di request.
8. Notifikasi ke dealer lewat dashboard — artinya dealer perlu login dulu untuk lihat notifikasi. Apakah ada kebutuhan notifikasi real-time (langsung muncul tanpa refresh) atau cukup muncul saat halaman dibuka/refresh?
   > jawaban: yap hanay ada di dashboard saja langsung muncul saat dibuka atau di refresh, atau interval ya? enaknya gimana? maksudnya interval setiap interval waktu tertentu selama masih berada di website tersebut maka otomatis fetch gitu.

Seputar Log

9. Log itu untuk keperluan apa utamanya — audit internal (kamu/admin bisa lihat siapa ngapain) atau juga untuk troubleshooting teknis (error tracking)? Karena ini mempengaruhi seberapa detail log yang perlu disimpan dan apakah perlu tool tambahan seperti Sentry.
   > jawaban: ya perlu keduanya yaitu audit dan error tracking juga kalau misal ada yang gagal misal gagl login atau submit/update sesuatu.
10. Apakah log perlu bisa diexport (misal ke Excel/CSV) oleh admin?
    > jawaban: tidak perlu. mungkin di admin ditambahkan untuk melihat semua log gitu? entah halaman baru atau kayak side modal window gitu dan juga filternya lengkap, aku tidak tahu enaknya gimana..

Seputar Pembelian / Invoice

11. Satu pembelian = satu invoice. Tapi apakah satu invoice bisa berisi produk dari dealer yang berbeda? Atau satu invoice pasti hanya dari satu dealer?
    > jawaban: pasti hanya dari 1 dealer, atau langsung dari sales (end customer langsung tanpa dari dealer)
12. File invoice yang diupload — apakah hanya disimpan (bisa didownload lagi) atau perlu dibaca isinya oleh sistem (OCR/parsing)?
    > jawaban: itu upload file atau gambar invoice gitu kok jadi aman aja, bisa didownload lagi ofcourse

note:

- jadi aku bingung enaknya pakai supabase atau pakai database storage sendiri, ini klienku sudah punya server sendiri dengan sisa disk masih di 35gb, kalau supabase yang free tier itu 500mb, tapi aku suka dengan fitur2nya cuma kalau misal scala nya jadi besar dan butuh lebih apa bisa migrasi ke database server klienku ya? maksudnya itu aku bingung dengan bagaimana denang fitur2 supabase yang sudah aku pakai selama ini, seperti OTP, api otomatis dari database yang dibuat, lalu akses2 itu aku lupa namanya kalau gasalah rls, menyimpan user, dan banyak lainnya.
- kemungkinan ini sistem akan melebar kemana2 sepertinya klienku punya rencana untuk menghubungkannya dengan sistem ticketing (buat lagi tapi expand gitu dari sistem yang ini nanti akan ada fitur ticketing yang menurutku cukup kompleks juga). jadi memang ini struktur database aku pertimbangkan degnan sangat sangat hati2 karna jika ada yang berubah meminimalisir error dan lain lain dan perubahan yang mayor hanya karna struktur database kurang optimal atau scalable.

mengenai requirement

- saat membuat dealer baru saat upload file DO (jika itu merupakan tujuannya delaer) dan membuat akun dealer baru tidak perlu mengirim email link set password, hanya pemberitahuan aja, karna kan loginnya tidak pakai password, tapi email dan otp
- sepertinya assign produk ke dealer tidak perlu dulu, apakah tapi ini tidak mempengaruhi struktur database kan? kalau tidak, tidak usah dulu tidak apa apa, karna kan kalau upload file DO langsung otomatis ke assign karna pasti ada nama dealernya
- pada 3.2 itu kan registrasi oleh admin/sales, nah itu berarti tidak perlu karna file DO sudah pasti kalau customer itu berarti sudah terjual. berarti status "unassigned" itu tidak ada di detail produk. oh maaf tetap ada sih kan misal kalau edit invoice yang data terjual langsung oleh sales maka jika diedit (salah satu sn dihapus) berarti itu tidak ada/unassigned
- ini aku baru kepikiran sepertinya log tidak perlu disimpan semuanya gaksih? kalau misal disimpan semua bakal ahbisin storage. apakah ada maks waktu gitu sebelum di purge
- aku juga baru kepikiran untuk yang upload DO file itu bagaimana jika user tidak sengaja mengupload file yang isinya sama. itu juga harus di antisipasi dan dibuatkan case dan juga bagaimana pencegahannya

pertanyaan2ku karna bingung mengenai tabel

- tabel user: di atribut "role" itu apakah bukannya lebih enak kalau dibuatkan tabel baru? aku lupa di database design itu apa istilahnya kalau misal 2 table berhubungan bisa menciptakan tabel baru hahaha, gitu lah intinya.
- tabel user: di atribut "is_deleted" mending lebih enak diganti dengan waktu dihapus atau null.
- tabel otp_requests: apakah ini tabel perlu ya? aku pakai supabase sih, setauku ini sudah ada fitur untuk otp, tapi gatau lagi ya gimana mekanismenya. tapi meskipun sama supabase sudah di handle, apakah masih perlu tabel ini?
- tabel delivery_orders: apakah ini tabel perlu ya? buat apa ya? buikannya nanti datanya saat parsing dan ddisubmit maka data digunakaan untuk tabel2 lainnya dan file yang diupload tadi sudah tidak penting lagi? atau bagaimana ya? karna kan memang tidak perlu disimpan. atau mungkin untuk menyimpan history? in case kalau user lupa file yang sudah di upload atau belum yang mana?? atau hanya metadata?? aku tidak paham
- kok pada dealer tidak ada array customernya, atau mungkin kamu taruh di customer untuk array delaer nya. supaay tahu ini customer punya dealer mana (jika memang beli dar idealer). tapi ternyata tidak ada, atau mungkin aku ada yang terlewat bagaiman cara mengetahuinya?
- tabel logs: mungkin bisa ditambahkan kategori log. dan kategori logs apakah pakai tabel baru? karna mungkin bisa jadi bertambah atau berkurang? tapi bagaiman menurutmu aku bingung sih hahaha aku lupa lupa ingat mata kuliah database engineering
- tabel purchases: apa bedanya id dengan group_id, kenapa pakai 2?
- tabel products: pada atribut "item_code" dan "item description" dari DO itu sebenarnya merupakan kategori produk dan nama tipe produk. jadi misal kategori POS system dan nama produknya HK-300 gitu. nah kategori dan nama produk ini sudah pasti sama. dan maka dengan itu harusnya ini ada baru lagi yaitu tabel kategori produk dan tipe produk gitu? maka kalau iya, aku ingin bisa tambahkan fitur baru yaitu manage kategori dan tipe. lebih detail adalah karna kata klienku untuk "item description" atau "item code" pada DO itu bisa sjaa tidak sesuai dengan keinginan namanya, misal kategori pos system itu di file DO bisa saja item codenya adalah POS-3453MFH gitu. nah jadi fitur manage kategori dan manage tipe produk itu bisa kayak convert gitu si harusnya

nah ini tanggapanku dari file yang sudah kamu buat, kalau misal ada plot hole baru lagi (wkwkwkw) tolong tanyakan lagi yaa untuk memastikan, sebelum kamu buatkan struktur atau detail requirement yang baru...

1. dealers
2. users
3. customers
4. delivery_orders
5. product_categories
6. product_types
7. item_code_mappings
8. products
9. invoices
10. purchases
11. purchase_items
12. warranty_conditions
13. otp_codes
14. waiting_list
15. notifications
16. audit_logs


repositories -> services -> api route -> frontend request



