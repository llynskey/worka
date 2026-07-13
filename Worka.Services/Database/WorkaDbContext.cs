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

        public DbSet<InterestRegistration> InterestRegistrations => Set<InterestRegistration>();

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
