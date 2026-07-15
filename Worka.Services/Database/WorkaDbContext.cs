using Microsoft.EntityFrameworkCore;
using Worka.Services.Database.DatabaseModels;
using Worka.Services.Database.Models;

namespace Worka.Services.Database
{
    public class WorkaDbContext : DbContext
    {
        public WorkaDbContext(DbContextOptions<WorkaDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();

        public DbSet<Customer> Customers => Set<Customer>();

        public DbSet<Professional> Professionals => Set<Professional>();

        public DbSet<Job> Jobs => Set<Job>();

        public DbSet<Quote> Quotes => Set<Quote>();

        public DbSet<WorkaPayment> WorkaPayments => Set<WorkaPayment>();

        public DbSet<InterestRegistration> InterestRegistrations => Set<InterestRegistration>();

        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

        public DbSet<Review> Reviews => Set<Review>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(user => user.UserId);
                entity.HasIndex(user => user.Email).IsUnique();
                entity.Property(user => user.FirstName).HasMaxLength(100).IsRequired();
                entity.Property(user => user.LastName).HasMaxLength(100).IsRequired();
                entity.Property(user => user.Email).HasMaxLength(320).IsRequired();
                entity.Property(user => user.PasswordHash).IsRequired();
                entity.Property(user => user.PasswordSalt).IsRequired();
            });

            modelBuilder.Entity<Customer>(entity =>
            {
                entity.ToTable("customers");
                entity.HasKey(customer => customer.CustomerId);
                entity.HasIndex(customer => customer.UserId).IsUnique();
                entity.Property(customer => customer.FirstName).HasMaxLength(100).IsRequired();
                entity.Property(customer => customer.LastName).HasMaxLength(100).IsRequired();
                entity.Property(customer => customer.Email).HasMaxLength(320).IsRequired();
                entity.Property(customer => customer.Phone).HasMaxLength(40).IsRequired();
                entity.Property(customer => customer.Address).HasMaxLength(500).IsRequired();
                entity.Property(customer => customer.Languages).HasMaxLength(200).IsRequired();
                entity.Property(customer => customer.PhotoUrl).HasMaxLength(1000).IsRequired();
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(customer => customer.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Professional>(entity =>
            {
                entity.ToTable("professionals");
                entity.HasKey(professional => professional.ProfessionalId);
                entity.HasIndex(professional => professional.UserId).IsUnique();
                entity.Property(professional => professional.FirstName).HasMaxLength(100).IsRequired();
                entity.Property(professional => professional.LastName).HasMaxLength(100).IsRequired();
                entity.Property(professional => professional.Email).HasMaxLength(320).IsRequired();
                entity.Property(professional => professional.Specialty).HasMaxLength(160).IsRequired();
                entity.Property(professional => professional.Bio).HasMaxLength(2000).IsRequired();
                entity.Property(professional => professional.ServiceArea).HasMaxLength(240).IsRequired();
                entity.Property(professional => professional.Languages).HasMaxLength(200).IsRequired();
                entity.Property(professional => professional.PhotoUrl).HasMaxLength(1000).IsRequired();
                entity.Property(professional => professional.StripeAccountId).HasMaxLength(200).IsRequired();
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(professional => professional.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Job>(entity =>
            {
                entity.ToTable("jobs");
                entity.HasKey(job => job.JobId);
                entity.Property(job => job.Name).HasMaxLength(160).IsRequired();
                entity.Property(job => job.Description).HasMaxLength(4000).IsRequired();
                entity.Property(job => job.Category).HasMaxLength(120).IsRequired();
                entity.Property(job => job.Address).HasMaxLength(500).IsRequired();
                entity.Property(job => job.LocationLabel).HasMaxLength(500).IsRequired();
                entity.Property(job => job.PhotoUrl).HasMaxLength(1000).IsRequired();
                entity.Property(job => job.Currency).HasMaxLength(8).IsRequired();
                entity.HasOne<Customer>()
                    .WithMany()
                    .HasForeignKey(job => job.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Quote>(entity =>
            {
                entity.ToTable("quotes");
                entity.HasKey(quote => quote.QuoteId);
                entity.Property(quote => quote.Description).HasMaxLength(4000).IsRequired();
                entity.Property(quote => quote.Price).HasPrecision(12, 2);
                entity.HasOne<Job>()
                    .WithMany()
                    .HasForeignKey(quote => quote.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Professional>()
                    .WithMany()
                    .HasForeignKey(quote => quote.ProfessionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<WorkaPayment>(entity =>
            {
                entity.ToTable("worka_payments");
                entity.HasKey(payment => payment.PaymentId);
                entity.HasIndex(payment => payment.StripeCheckoutSessionId).IsUnique();
                entity.Property(payment => payment.StripeCheckoutSessionId).HasMaxLength(200).IsRequired();
                entity.Property(payment => payment.StripePaymentIntentId).HasMaxLength(200).IsRequired();
                entity.Property(payment => payment.StripeConnectedAccountId).HasMaxLength(200).IsRequired();
                entity.Property(payment => payment.QuoteAmount).HasPrecision(12, 2);
                entity.Property(payment => payment.ServiceFeeAmount).HasPrecision(12, 2);
                entity.Property(payment => payment.TotalAmount).HasPrecision(12, 2);
                entity.Property(payment => payment.WorkerAmount).HasPrecision(12, 2);
                entity.Property(payment => payment.Currency).HasMaxLength(10).IsRequired();
                entity.Property(payment => payment.Status).HasMaxLength(40).IsRequired();
                entity.HasOne<Job>()
                    .WithMany()
                    .HasForeignKey(payment => payment.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Quote>()
                    .WithMany()
                    .HasForeignKey(payment => payment.QuoteId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Customer>()
                    .WithMany()
                    .HasForeignKey(payment => payment.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Professional>()
                    .WithMany()
                    .HasForeignKey(payment => payment.ProfessionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("reviews");
                entity.HasKey(review => review.ReviewId);
                entity.HasIndex(review => review.JobId).IsUnique();
                entity.HasIndex(review => review.ProfessionalId);
                entity.Property(review => review.Comment).HasMaxLength(2000).IsRequired();
                entity.HasOne<Job>()
                    .WithMany()
                    .HasForeignKey(review => review.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Customer>()
                    .WithMany()
                    .HasForeignKey(review => review.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<Professional>()
                    .WithMany()
                    .HasForeignKey(review => review.ProfessionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.ToTable("password_reset_tokens");
                entity.HasKey(token => token.TokenId);
                entity.HasIndex(token => token.UserId);
                entity.Property(token => token.TokenHash).HasMaxLength(128).IsRequired();
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(token => token.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<InterestRegistration>(entity =>
            {
                entity.ToTable("interest_registrations");
                entity.HasKey(registration => registration.InterestRegistrationId);
                entity.HasIndex(registration => registration.NormalizedEmail).IsUnique();
                entity.Property(registration => registration.Name).HasMaxLength(160).IsRequired();
                entity.Property(registration => registration.Email).HasMaxLength(320).IsRequired();
                entity.Property(registration => registration.NormalizedEmail).HasMaxLength(320).IsRequired();
                entity.Property(registration => registration.Role).HasMaxLength(80).IsRequired();
                entity.Property(registration => registration.Language).HasMaxLength(120).IsRequired();
                entity.Property(registration => registration.Location).HasMaxLength(160).IsRequired();
                entity.Property(registration => registration.Message).HasMaxLength(2000).IsRequired();
                entity.Property(registration => registration.Source).HasMaxLength(120).IsRequired();
            });
        }
    }
}
